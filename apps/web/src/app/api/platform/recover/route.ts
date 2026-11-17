import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertCredentialDisplayKey, createCredentialNonce, sealManualAdminCredential } from '@/lib/security/manual-admin-credential';

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
  if (body?.manualContactVerified !== true
      || !/^[0-9a-f-]{36}$/i.test(applicationId)
      || !['phone_call', 'in_person', 'signed_authorization'].includes(verificationMethod)
      || verificationNote.length < 20) {
    return json({ error: 'Recovery-এর আগে পরিচয় পুনরায় যাচাইয়ের পদ্ধতি এবং ২০–৫০০ অক্ষরের কারণ লিখুন।' }, 400);
  }

  try { assertCredentialDisplayKey(); } catch { return json({ error: 'Credential display encryption key সার্ভারে কনফিগার করা নেই।' }, 503); }

  const { data: reservation, error: reserveError } = await owner.supabase.rpc(
    'owner_reserve_manual_admin_password_reset',
    {
      p_application_id: applicationId,
      p_verification_method: verificationMethod,
      p_verification_note: verificationNote,
    },
  );

  if (reserveError || !reservation?.reset_request_id || !reservation?.auth_user_id) {
    return json({
      error: 'এই আবেদন থেকে তৈরি MDI Manual Admin Account পাওয়া যায়নি, অথবা Recovery limit অতিক্রম হয়েছে।',
    }, 409);
  }

  const handoff = createCredentialNonce();
  const { error: handoffError } = await owner.supabase.rpc('owner_create_manual_admin_credential_handoff', {
    p_nonce_hash: handoff.nonceHash,
  });
  if (handoffError) {
    await owner.supabase.rpc('owner_complete_manual_admin_password_reset', {
      p_reset_request_id: reservation.reset_request_id,
      p_succeeded: false,
      p_error_code: 'audit_finalize_failed',
    });
    return json({ error: 'একবার ব্যবহারযোগ্য Credential নিরাপদ ব্যবস্থা প্রস্তুত করা যায়নি। Password পরিবর্তন করা হয়নি।' }, 503);
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    await owner.supabase.rpc('owner_complete_manual_admin_password_reset', {
      p_reset_request_id: reservation.reset_request_id,
      p_succeeded: false,
      p_error_code: 'auth_update_failed',
    });
    return json({ error: 'Server-side Auth Admin configuration অনুপস্থিত। Password পরিবর্তন করা হয়নি।' }, 503);
  }

  const { data: lookup, error: lookupError } = await admin.auth.admin.getUserById(reservation.auth_user_id);
  const target = lookup?.user;
  if (lookupError || !target) {
    await owner.supabase.rpc('owner_complete_manual_admin_password_reset', {
      p_reset_request_id: reservation.reset_request_id,
      p_succeeded: false,
      p_error_code: 'auth_update_failed',
    });
    return json({ error: 'Target Auth Account পাওয়া যায়নি। Password অপরিবর্তিত রাখা হয়েছে।' }, 409);
  }

  const isManualIdentity = Boolean(
    target.email
    && /^mdi-[0-9a-f]{32}@login\.sahitech\.invalid$/i.test(target.email)
    && target.email_confirmed_at
    && target.app_metadata?.mdi_manual_madrasa_admin === true
    && target.app_metadata?.mdi_application_id === applicationId
  );
  if (!isManualIdentity) {
    await owner.supabase.rpc('owner_complete_manual_admin_password_reset', {
      p_reset_request_id: reservation.reset_request_id,
      p_succeeded: false,
      p_error_code: 'auth_update_failed',
    });
    return json({ error: 'Target account MDI Manual Admin identity হিসেবে নিশ্চিত করা যায়নি। Password অপরিবর্তিত রাখা হয়েছে।' }, 409);
  }

  const temporaryPassword = `Mdi-${randomBytes(32).toString('base64url')}!9`;
  const nextMetadata = {
    ...(target?.app_metadata ?? {}),
    mdi_manual_madrasa_admin: true,
    mdi_force_password_change: true,
    mdi_password_reset_at: new Date().toISOString(),
  };

  const { error: updateError } = await admin.auth.admin.updateUserById(target.id, {
    password: temporaryPassword,
    app_metadata: nextMetadata,
  });

  if (updateError) {
    await owner.supabase.rpc('owner_complete_manual_admin_password_reset', {
      p_reset_request_id: reservation.reset_request_id,
      p_succeeded: false,
      p_error_code: 'auth_update_failed',
    });
    return json({ error: 'Password Reset ব্যর্থ হয়েছে। আগের Password অপরিবর্তিত রয়েছে।' }, 500);
  }

  const { error: auditError } = await owner.supabase.rpc('owner_complete_manual_admin_password_reset', {
    p_reset_request_id: reservation.reset_request_id,
    p_succeeded: true,
  });

  if (auditError) {
    // Do not expose the new credential unless the audit outcome is recorded.
    // Keep the password-change gate enabled; Owner must inspect the audit trail.
    return json({ error: 'Password Reset হয়েছে, কিন্তু Audit confirmation ব্যর্থ হয়েছে। নিরাপত্তার জন্য নতুন Password প্রকাশ করা হয়নি; Owner audit পরীক্ষা করুন।' }, 500);
  }

  try { revalidatePath('/platform'); } catch { /* Credential remains available in this no-store response. */ }

  const credentialCookie = sealManualAdminCredential({
    ownerUserId: owner.user.id,
    nonce: handoff.nonce,
    loginIdentifier: target.email,
    temporaryPassword,
    institutionName: reservation.institution_name,
    contactEmail: reservation.contact_email,
    contactEmailVerified: false,
    activationStatus: reservation.is_active === true ? 'active' : 'pending_activation',
    issuedAt: Date.now(),
  });
  const response = json({ success: true, credentialPath: '/api/platform/credential' });
  response.cookies.set(credentialCookie.name, credentialCookie.value, credentialCookie.options);
  return response;
}
