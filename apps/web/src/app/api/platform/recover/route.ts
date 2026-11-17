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
  return { supabase };
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
  const reason = String(body?.reason || '').trim();
  const verificationMethod = String(body?.verificationMethod || '');
  if (!/^[0-9a-f-]{36}$/i.test(applicationId) || reason.length < 20 || reason.length > 500) {
    return json({ error: 'আবেদন এবং recovery reason সঠিকভাবে দিন (কমপক্ষে ২০ অক্ষর)।' }, 400);
  }
  if (body?.manualContactVerified !== true ||
      !['phone_call', 'whatsapp', 'in_person'].includes(verificationMethod)) {
    return json({ error: 'Recovery-এর আগে নিবন্ধিত যোগাযোগ মাধ্যমে পরিচয় পুনরায় যাচাই করতে হবে।' }, 400);
  }

  const { data: target, error: prepareError } = await owner.supabase.rpc(
    'owner_prepare_manual_admin_recovery',
    {
      p_application_id: applicationId,
      p_reason: reason,
      p_contact_verification_method: verificationMethod,
    },
  );

  if (prepareError || !target?.admin_user_id) {
    return json({ error: 'এই আবেদনের জন্য নিরাপদ Manual Admin Recovery পাওয়া যায়নি।' }, 409);
  }

  let outcome: 'succeeded' | 'failed' = 'failed';
  let errorCode = 'auth_admin_update_failed';
  const temporaryPassword = `Mdi-${randomBytes(32).toString('base64url')}!9`;

  try {
    const admin = createAdminClient();
    const { data: current, error: lookupError } = await admin.auth.admin.getUserById(target.admin_user_id);
    if (lookupError || !current.user ||
        current.user.app_metadata?.mdi_manual_provisioning !== true) {
      throw new Error('manual_identity_not_found');
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(target.admin_user_id, {
      password: temporaryPassword,
      app_metadata: {
        ...current.user.app_metadata,
        mdi_force_password_change: true,
      },
    });
    if (updateError) throw new Error('credential_reset_failed');

    outcome = 'succeeded';
    errorCode = '';
  } catch {
    // The reason and requested outcome are audited without credential material.
  }

  const { error: auditError } = await owner.supabase.rpc('owner_finalize_manual_admin_recovery', {
    p_application_id: applicationId,
    p_admin_user_id: target.admin_user_id,
    p_outcome: outcome,
    p_error_code: auditErrorCode(errorCode),
  });

  if (outcome !== 'succeeded' || auditError) {
    return json({ error: 'Recovery সম্পন্ন হয়েছে কি না নিশ্চিত করা যায়নি। Owner audit trail পরীক্ষা করুন।' }, 500);
  }

  revalidatePath('/platform');
  return json({
    success: true,
    loginIdentifier: target.login_identifier,
    temporaryPassword,
    contactEmail: target.contact_email,
    message: 'নতুন Temporary Password একবার দেখানো হচ্ছে। প্রথম Login-এ পরিবর্তন বাধ্যতামূলক।',
  });
}

function auditErrorCode(value: string) {
  return value.slice(0, 80);
}
