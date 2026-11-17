import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Vary: 'Cookie, Origin',
    },
  });
}

async function requireOwner() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return null;

  const { data: isOwner, error: ownerError } = await (supabase.rpc as any)('is_platform_owner');
  if (ownerError || isOwner !== true) return null;

  return { supabase, user };
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function publicProvisioningError(message?: string) {
  const known: Array<[string, string]> = [
    ['at_least_one_application_document_must_be_verified', 'অন্তত একটি প্রয়োজনীয় ডকুমেন্ট Verify করতে হবে।'],
    ['application_documents_not_fully_reviewed', 'সব আবেদনপত্রের ডকুমেন্ট Review সম্পন্ন করুন।'],
    ['tenant_identifier_already_in_use', 'প্রতিষ্ঠানের Code বা Subdomain আগে থেকেই ব্যবহৃত হচ্ছে।'],
    ['application_already_provisioned', 'এই আবেদন থেকে মাদ্রাসার Admin Account ইতিমধ্যে তৈরি হয়েছে।'],
    ['manual_provisioning_already_in_progress', 'এই আবেদনের Account Setup ইতিমধ্যে চলছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।'],
    ['manual_provisioning_rate_limited', 'নিরাপত্তার কারণে এই আবেদনের Setup Attempt সীমিত করা হয়েছে।'],
    ['manual_contact_verification_required', 'আবেদনকারীর পরিচয় যাচাইয়ের পদ্ধতি ও নোট আবশ্যক।'],
    ['application_missing_tenant_identifiers', 'আবেদনে Institution Code বা Subdomain অনুপস্থিত।'],
  ];
  return known.find(([code]) => message?.includes(code))?.[1]
    || 'নিরাপদভাবে অ্যাকাউন্ট তৈরি করা যায়নি। আবেদন, ডকুমেন্ট ও Audit Trail যাচাই করুন।';
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return json({ error: 'এই অনুরোধটি গ্রহণ করা যায়নি।' }, 403);
  }

  const owner = await requireOwner();
  if (!owner) return json({ error: 'Global Owner-এর MFA-verified session প্রয়োজন।' }, 403);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'অনুরোধের তথ্য সঠিক নয়।' }, 400);
  }

  const applicationId = cleanText(body?.applicationId, 64);
  const verificationMethod = cleanText(body?.verificationMethod, 32);
  const verificationNote = cleanText(body?.verificationNote, 500);
  const activateImmediately = body?.activateImmediately === true;

  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) {
    return json({ error: 'আবেদনের পরিচিতি সঠিক নয়।' }, 400);
  }
  if (body?.manualContactVerified !== true
      || !['phone_call', 'whatsapp', 'in_person', 'signed_authorization'].includes(verificationMethod)
      || verificationNote.length < 20) {
    return json({ error: 'প্রথমে আবেদনকারীর পরিচয় ফোন, WhatsApp, সরাসরি সাক্ষাৎ বা স্বাক্ষরিত অনুমোদনের মাধ্যমে যাচাই করুন এবং ২০–৫০০ অক্ষরের নোট দিন।' }, 400);
  }

  let reservationId: string | null = null;
  let authUserId: string | null = null;
  let admin: ReturnType<typeof createAdminClient> | null = null;

  try {
    // Reservation is committed before creating an Auth identity. This prevents
    // concurrent Owner clicks from creating multiple accounts for one application.
    admin = createAdminClient();
    const loginIdentifier = `mdi-${randomBytes(16).toString('hex')}@login.sahitech.invalid`;

    const { data: reservation, error: reserveError } = await owner.supabase.rpc(
      'owner_reserve_manual_admin_provisioning',
      {
        p_application_id: applicationId,
        p_login_identifier: loginIdentifier,
        p_activate_immediately: activateImmediately,
        p_contact_verification_method: verificationMethod,
        p_contact_verification_note: verificationNote,
      },
    );

    if (reserveError || !reservation?.reservation_id) {
      return json({ error: publicProvisioningError(reserveError?.message) }, 409);
    }
    reservationId = reservation.reservation_id;

    // Cryptographic 256-bit temporary credential; it is never written to SQL/logs.
    const temporaryPassword = `Mdi-${randomBytes(32).toString('base64url')}!9`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: loginIdentifier,
      password: temporaryPassword,
      email_confirm: true, // Confirms only the non-routable platform-issued login alias.
      app_metadata: {
        mdi_manual_madrasa_admin: true,
        mdi_force_password_change: true,
        mdi_application_id: applicationId,
        mdi_provisioning_reservation_id: reservationId,
        mdi_contact_email: reservation.contact_email,
        mdi_contact_email_verified: false,
      },
      user_metadata: {
        full_name_en: reservation.contact_person_name || reservation.institution_name,
      },
    });

    if (createError || !created.user) {
      await owner.supabase.rpc('owner_fail_manual_admin_provisioning', {
        p_reservation_id: reservationId,
        p_error_code: 'auth_user_creation_failed',
      });
      return json({ error: 'নিরাপদ Login Account তৈরি করা যায়নি। সার্ভার কনফিগারেশন পরীক্ষা করুন।' }, 503);
    }

    authUserId = created.user.id;

    const { data: completed, error: completeError } = await owner.supabase.rpc(
      'owner_complete_manual_admin_provisioning',
      { p_reservation_id: reservationId, p_auth_user_id: authUserId },
    );

    if (completeError || !completed?.tenant_id) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(authUserId);
      if (deleteError) {
        await admin.auth.admin.updateUserById(authUserId, { ban_duration: '876000h' });
      } else {
        authUserId = null;
      }

      await owner.supabase.rpc('owner_fail_manual_admin_provisioning', {
        p_reservation_id: reservationId,
        p_error_code: authUserId ? 'auth_user_cleanup_failed' : 'tenant_finalization_failed',
      });

      return json({ error: publicProvisioningError(completeError?.message) }, 409);
    }

    // Do not let cache invalidation swallow the only credential copy.
    try { revalidatePath('/platform'); } catch { /* Next navigation will refresh the view. */ }

    return json({
      success: true,
      loginIdentifier: completed.login_identifier,
      temporaryPassword,
      institutionName: completed.institution_name,
      activationStatus: completed.activated === true ? 'active' : 'pending_activation',
      tenantId: completed.tenant_id,
      contactEmail: reservation.contact_email,
      contactEmailVerified: false,
    });
  } catch {
    if (reservationId) {
      if (authUserId && admin) {
        const { error: deleteError } = await admin.auth.admin.deleteUser(authUserId);
        if (deleteError) {
          await admin.auth.admin.updateUserById(authUserId, { ban_duration: '876000h' });
        } else {
          authUserId = null;
        }
      }
      await owner.supabase.rpc('owner_fail_manual_admin_provisioning', {
        p_reservation_id: reservationId,
        p_error_code: authUserId ? 'auth_user_cleanup_failed' : 'provisioning_failed',
      });
    }
    return json({ error: 'সার্ভারে নিরাপদ Account Setup সম্পন্ন করা যায়নি। আবার চেষ্টা করার আগে Audit Trail যাচাই করুন।' }, 500);
  }
}
