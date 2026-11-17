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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return null;

  const { data: isOwner, error: ownerError } = await (supabase.rpc as any)('is_platform_owner');
  if (ownerError || isOwner !== true) return null;

  return { supabase, user };
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

  const applicationId = String(body?.applicationId || '');
  const activateImmediately = body?.activateImmediately === true;
  const verificationMethod = String(body?.verificationMethod || '');
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) {
    return json({ error: 'আবেদনের পরিচিতি সঠিক নয়।' }, 400);
  }
  if (body?.manualContactVerified !== true ||
      !['phone_call', 'whatsapp', 'in_person'].includes(verificationMethod)) {
    return json({ error: 'অ্যাকাউন্ট তৈরির আগে আবেদনকারীর সঙ্গে যোগাযোগ করে পরিচয় যাচাই করতে হবে।' }, 400);
  }

  const { data: application, error: applicationError } = await owner.supabase
    .from('madrasa_applications')
    .select('id,institution_name,contact_person_name,contact_email,contact_phone,status')
    .eq('id', applicationId)
    .maybeSingle();

  if (applicationError || !application) {
    return json({ error: 'আবেদনটি পাওয়া যায়নি অথবা দেখার অনুমতি নেই।' }, 404);
  }

  const loginIdentifier = `mdi-${randomBytes(12).toString('hex')}@accounts.sahitech.invalid`;
  const temporaryPassword = `Mdi-${randomBytes(32).toString('base64url')}!9`;

  let adminUserId: string | null = null;
  try {
    const admin = createAdminClient();

    // The only confirmed address is a platform-generated, non-deliverable
    // login alias. The applicant's real contact_email is never auto-confirmed.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: loginIdentifier,
      password: temporaryPassword,
      email_confirm: true,
      app_metadata: {
        mdi_manual_provisioning: true,
        mdi_force_password_change: true,
        mdi_contact_email: application.contact_email,
        mdi_contact_email_verified: false,
        mdi_login_type: 'owner_issued_alias',
      },
      user_metadata: {
        full_name_en: application.contact_person_name,
      },
    });

    if (createError || !created.user) {
      return json({ error: 'নিরাপদ লগইন অ্যাকাউন্ট তৈরি করা যায়নি। সার্ভার কনফিগারেশন পরীক্ষা করুন।' }, 503);
    }
    adminUserId = created.user.id;

    const { data: provisioned, error: provisionError } = await owner.supabase.rpc(
      'owner_provision_manual_madrasa_admin',
      {
        p_application_id: applicationId,
        p_admin_user_id: adminUserId,
        p_activate_immediately: activateImmediately,
        p_contact_verification_method: verificationMethod,
      },
    );

    if (provisionError || !provisioned?.tenant_id) {
      // The Auth user is removed if the atomic database provisioning step fails.
      await admin.auth.admin.deleteUser(adminUserId);
      adminUserId = null;
      return json({
        error: provisionError?.message === 'manual_provisioning_rate_limit'
          ? 'নিরাপত্তার কারণে সাময়িকভাবে নতুন অ্যাকাউন্ট তৈরি সীমিত করা হয়েছে।'
          : 'আবেদনটি এখন অ্যাকাউন্ট তৈরির উপযোগী নয়। নথি, অনুমোদন ও আগের provisioning অবস্থা পরীক্ষা করুন।',
      }, 409);
    }

    revalidatePath('/platform');

    // The password exists only in this no-store response and the Owner's
    // transient component state. It is never returned by a SQL function,
    // persisted in the database, or written to application logs.
    return json({
      success: true,
      loginIdentifier,
      temporaryPassword,
      institutionName: application.institution_name,
      contactEmail: application.contact_email,
      activationStatus: provisioned.activation_status,
      tenantId: provisioned.tenant_id,
    });
  } catch {
    if (adminUserId) {
      try {
        await createAdminClient().auth.admin.deleteUser(adminUserId);
      } catch {
        // Never log credentials. Orphaned, unassigned Auth identities are
        // harmless to tenant access and require operational follow-up.
      }
    }
    return json({ error: 'সার্ভারে নিরাপদভাবে অ্যাকাউন্ট তৈরি করা যায়নি।' }, 500);
  }
}
