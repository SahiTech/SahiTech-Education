'use server';

import { createHash, createHmac, randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function requirePlatformOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Global Platform Owner access required.');

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') throw new Error('A verified MFA session is required.');

  const { data: isOwner, error } = await (supabase.rpc as any)('is_platform_owner');
  if (error || isOwner !== true) throw new Error('Global Platform Owner authorization failed.');
  return { supabase, user };
}

function generateTemporaryPassword(): string {
  // 256 bits of cryptographic randomness; the suffix guarantees mixed character classes.
  return `${randomBytes(32).toString('base64url')}Aa7!`;
}

function safeProvisioningError(message?: string): string {
  const known: Array<[string, string]> = [
    ['at_least_one_application_document_must_be_verified', 'অন্তত একটি সহায়ক ডকুমেন্ট Verify করতে হবে।'],
    ['pending_application_documents_must_be_reviewed', 'সব Pending ডকুমেন্ট Review না করা পর্যন্ত সেটআপ করা যাবে না।'],
    ['application_documents_not_fully_reviewed', 'সব আবেদনপত্রের ডকুমেন্ট Review সম্পন্ন করুন।'],
    ['tenant_identifier_already_in_use', 'প্রতিষ্ঠানের Code বা Subdomain আগে থেকেই ব্যবহৃত হচ্ছে।'],
    ['application_already_provisioned', 'এই আবেদন থেকে মাদ্রাসার অ্যাকাউন্ট ইতিমধ্যে তৈরি হয়েছে।'],
    ['manual_provisioning_already_in_progress', 'এই আবেদনের Account Setup ইতিমধ্যে চলছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'],
    ['manual_provisioning_rate_limited', 'নিরাপত্তার জন্য এই আবেদনের Setup Attempt সীমিত করা হয়েছে। পরে আবার চেষ্টা করুন।'],
    ['application_missing_tenant_identifiers', 'আবেদনে Madrasa Code বা Subdomain অনুপস্থিত।'],
  ];
  const match = known.find(([code]) => message?.includes(code));
  return match?.[1] || 'নিরাপদভাবে অ্যাকাউন্ট তৈরি করা যায়নি। আবেদন ও ডকুমেন্ট যাচাই করে আবার চেষ্টা করুন।';
}

export async function updateApplicationStatus(formData: FormData) {
  const { supabase } = await requirePlatformOwner();
  const id = String(formData.get('applicationId') || '');
  const status = String(formData.get('status') || '');
  const note = String(formData.get('reviewNote') || '').trim().slice(0, 2000);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['under_review','info_requested','rejected'].includes(status)) {
    throw new Error('Invalid application review request.');
  }
  const { error } = await (supabase.rpc as any)('owner_update_application_status', {
    p_application_id: id, p_status: status, p_review_note: note || null,
  });
  if (error) throw new Error('Could not update application review status.');
  revalidatePath('/platform');
}

export async function issueApplicationInvitation(formData: FormData) {
  const { supabase } = await requirePlatformOwner();
  const applicationId = String(formData.get('applicationId') || '');
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) throw new Error('Invalid application.');

  const hmacSecret = process.env.MDI_EMAIL_TOKEN_HMAC_SECRET;
  if (!hmacSecret || Buffer.byteLength(hmacSecret, 'utf8') < 32) {
    throw new Error('Secure invitation delivery is not configured. Use Manual Admin Activation until the invitation secret and email delivery are configured.');
  }

  const tokenNonce = randomBytes(32).toString('hex');
  const rawToken = createHmac('sha256', hmacSecret)
    .update(`mdi-invitation:${applicationId}:${tokenNonce}`)
    .digest('hex')
    .toUpperCase();
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const { error } = await (supabase.rpc as any)('owner_issue_invitation', {
    p_application_id: applicationId, p_token_hash: tokenHash, p_token_nonce: tokenNonce,
  });
  if (error) throw new Error('Invitation could not be issued. Verify application requirements.');
  revalidatePath('/platform');
}

export async function activateTenant(formData: FormData) {
  const { supabase } = await requirePlatformOwner();
  const tenantId = String(formData.get('tenantId') || '');
  if (!/^[0-9a-f-]{36}$/i.test(tenantId)) throw new Error('Invalid tenant.');
  const { error } = await (supabase.rpc as any)('owner_activate_tenant', { p_tenant_id: tenantId });
  if (error) throw new Error('Tenant is not ready for final activation.');
  revalidatePath('/platform');
}

export async function reviewApplicationDocument(formData: FormData) {
  const { supabase } = await requirePlatformOwner();
  const documentId = String(formData.get('documentId') || '');
  const status = String(formData.get('status') || '');
  const note = String(formData.get('reviewNote') || '').trim().slice(0, 2000);
  if (!/^[0-9a-f-]{36}$/i.test(documentId) || !['verified','rejected'].includes(status)) {
    throw new Error('Invalid document review request.');
  }
  const { error } = await (supabase.rpc as any)('owner_review_application_document', {
    p_document_id: documentId, p_status: status, p_review_note: note || null,
  });
  if (error) throw new Error('Could not save document verification decision.');
  revalidatePath('/platform');
}

export type ManualAdminCredentials = {
  tenant_id: string;
  login_identifier: string;
  temporary_password: string;
  institution_name: string;
  subdomain: string;
  activated: boolean;
  contact_email_verified: boolean;
  audit_warning?: string;
};

export type ManualAdminActionResult = {
  success: boolean;
  error?: string;
  data?: ManualAdminCredentials;
};

/**
 * Creates a dedicated, non-routable login identity for the madrasa administrator.
 * The submitted contact email is kept on the application/tenant record and is never
 * confirmed or used as the Auth login identity. The temporary password exists only
 * in this request's memory and in the one-time response to the MFA-protected Owner.
 */
export async function provisionMadrasaAdminManually(params: {
  applicationId: string;
  activateImmediately?: boolean;
}): Promise<ManualAdminActionResult> {
  let reservationId: string | null = null;
  let createdAuthUserId: string | null = null;
  let ownerClient: Awaited<ReturnType<typeof createClient>> | null = null;
  let adminClient: ReturnType<typeof createAdminClient> | null = null;

  try {
    const { supabase } = await requirePlatformOwner();
    ownerClient = supabase;
    if (!/^[0-9a-f-]{36}$/i.test(params.applicationId)) {
      return { success: false, error: 'অবৈধ আবেদন সনাক্তকারী।' };
    }

    adminClient = createAdminClient();
    const loginIdentifier = `mdi-${randomBytes(16).toString('hex')}@login.sahitech.invalid`;
    const { data: reservation, error: reserveError } = await (supabase.rpc as any)(
      'owner_reserve_manual_admin_provisioning',
      {
        p_application_id: params.applicationId,
        p_login_identifier: loginIdentifier,
        p_activate_immediately: params.activateImmediately !== false,
      }
    );

    if (reserveError || !reservation?.reservation_id) {
      return { success: false, error: safeProvisioningError(reserveError?.message) };
    }
    reservationId = reservation.reservation_id;

    const temporaryPassword = generateTemporaryPassword();

    // This is an internal .invalid login identifier, not the applicant's contact email.
    // It is deliberately non-deliverable; only this system-generated alias is confirmed
    // so password authentication works without SMTP. The actual contact email remains unverified.
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: loginIdentifier,
      password: temporaryPassword,
      email_confirm: true,
      app_metadata: {
        mdi_manual_madrasa_admin: true,
        mdi_force_password_change: true,
        mdi_application_id: params.applicationId,
        mdi_provisioning_reservation_id: reservationId,
        mdi_contact_email_verified: false,
      },
      user_metadata: {
        full_name_en: reservation.contact_person_name || reservation.institution_name,
      },
    });

    if (createError || !created.user) {
      await (supabase.rpc as any)('owner_fail_manual_admin_provisioning', {
        p_reservation_id: reservationId,
        p_error_code: 'auth_user_creation_failed',
      });
      return { success: false, error: 'নিরাপদ Login Account তৈরি করা যায়নি। Service configuration যাচাই করুন।' };
    }

    createdAuthUserId = created.user.id;

    const { data: completed, error: completeError } = await (supabase.rpc as any)(
      'owner_complete_manual_admin_provisioning',
      { p_reservation_id: reservationId, p_auth_user_id: created.user.id }
    );

    if (completeError || !completed?.tenant_id) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(created.user.id);
      if (deleteError) {
        await adminClient.auth.admin.updateUserById(created.user.id, { ban_duration: '876000h' });
      }
      await (supabase.rpc as any)('owner_fail_manual_admin_provisioning', {
        p_reservation_id: reservationId,
        p_error_code: deleteError ? 'auth_user_cleanup_failed' : 'tenant_finalization_failed',
      });
      return { success: false, error: safeProvisioningError(completeError?.message) };
    }

    createdAuthUserId = null;
    // Cache invalidation must never swallow the only copy of a newly generated credential.
    try { revalidatePath('/platform'); } catch { /* Provisioning already committed; the next navigation refreshes the page. */ }

    // Deliberate one-time credential response. The client keeps it in component memory only.
    return {
      success: true,
      data: {
        tenant_id: completed.tenant_id,
        login_identifier: completed.login_identifier,
        temporary_password: temporaryPassword,
        institution_name: completed.institution_name,
        subdomain: completed.subdomain,
        activated: completed.activated === true,
        contact_email_verified: false,
      },
    };
  } catch {
    if (reservationId && ownerClient) {
      if (createdAuthUserId && adminClient) {
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(createdAuthUserId);
        if (deleteError) {
          await adminClient.auth.admin.updateUserById(createdAuthUserId, { ban_duration: '876000h' });
        } else {
          createdAuthUserId = null;
        }
      }
      await (ownerClient.rpc as any)('owner_fail_manual_admin_provisioning', {
        p_reservation_id: reservationId,
        p_error_code: createdAuthUserId ? 'auth_user_cleanup_failed' : 'provisioning_failed',
      });
    }
    return { success: false, error: 'সার্ভারে নিরাপদ Account Setup সম্পন্ন করা যায়নি। আবার চেষ্টা করার আগে Audit Trail যাচাই করুন।' };
  }
}

/**
 * Explicit Owner-assisted recovery for an already-provisioned madrasa.
 * The Owner must record how the account holder was verified. Existing email
 * confirmation state is never changed by this operation.
 */
export async function resetMadrasaAdminPasswordManually(params: {
  applicationId: string;
  verificationMethod: 'phone_call' | 'in_person' | 'signed_authorization';
  verificationNote: string;
}): Promise<ManualAdminActionResult> {
  try {
    const { supabase } = await requirePlatformOwner();
    if (!/^[0-9a-f-]{36}$/i.test(params.applicationId)) {
      return { success: false, error: 'অবৈধ আবেদন সনাক্তকারী।' };
    }
    if (!['phone_call', 'in_person', 'signed_authorization'].includes(params.verificationMethod)
      || params.verificationNote.trim().length < 20
      || params.verificationNote.trim().length > 500) {
      return { success: false, error: 'পরিচয় যাচাইয়ের পদ্ধতি ও কমপক্ষে ২০ অক্ষরের কারণ লিখুন।' };
    }

    const admin = createAdminClient();
    const { data: reservation, error: reserveError } = await (supabase.rpc as any)(
      'owner_reserve_manual_admin_password_reset',
      {
        p_application_id: params.applicationId,
        p_verification_method: params.verificationMethod,
        p_verification_note: params.verificationNote.trim(),
      }
    );

    if (reserveError || !reservation?.reset_request_id || !reservation?.auth_user_id) {
      return { success: false, error: safeProvisioningError(reserveError?.message) };
    }

    const { data: existing, error: getUserError } = await admin.auth.admin.getUserById(reservation.auth_user_id);
    const existingUser = existing?.user;
    if (getUserError || !existingUser?.email || !existingUser.email_confirmed_at) {
      await (supabase.rpc as any)('owner_complete_manual_admin_password_reset', {
        p_reset_request_id: reservation.reset_request_id,
        p_succeeded: false,
        p_error_code: 'auth_update_failed',
      });
      return { success: false, error: 'এই Account-এর Auth Identity যাচাই করা যায়নি। নিরাপদভাবে Password Reset করা হয়নি।' };
    }

    const temporaryPassword = generateTemporaryPassword();
    const now = new Date().toISOString();
    const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
      password: temporaryPassword,
      app_metadata: {
        ...existingUser.app_metadata,
        mdi_manual_madrasa_admin: true,
        mdi_force_password_change: true,
        mdi_password_reset_at: now,
      },
    });

    if (updateError) {
      await (supabase.rpc as any)('owner_complete_manual_admin_password_reset', {
        p_reset_request_id: reservation.reset_request_id,
        p_succeeded: false,
        p_error_code: 'auth_update_failed',
      });
      return { success: false, error: 'Password Reset ব্যর্থ হয়েছে। আগের Password পরিবর্তন করা হয়নি।' };
    }

    const { error: finishError } = await (supabase.rpc as any)('owner_complete_manual_admin_password_reset', {
      p_reset_request_id: reservation.reset_request_id,
      p_succeeded: true,
    });

    revalidatePath('/platform');
    return {
      success: true,
      data: {
        tenant_id: reservation.tenant_id,
        login_identifier: existingUser.email,
        temporary_password: temporaryPassword,
        institution_name: reservation.institution_name || 'Madrasa Admin',
        subdomain: reservation.subdomain || '',
        activated: reservation.is_active === true,
        contact_email_verified: existingUser.email.endsWith('@login.sahitech.invalid')
          ? existingUser.app_metadata?.mdi_contact_email_verified === true
          : Boolean(existingUser.email_confirmed_at),
        ...(finishError ? { audit_warning: 'Password reset হয়েছে, তবে completion audit নিশ্চিত করা যায়নি। পুনরায় Reset করবেন না; Owner Audit Trail যাচাই করুন।' } : {}),
      },
    };
  } catch {
    return { success: false, error: 'Owner-assisted Password Recovery সম্পন্ন করা যায়নি। Audit Trail যাচাই করুন।' };
  }
}
