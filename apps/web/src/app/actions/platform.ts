'use server';

import { createHash, createHmac, randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
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
  const tokenNonce = randomBytes(32).toString('hex');
  const hmacSecret = (process.env.MDI_EMAIL_TOKEN_HMAC_SECRET && Buffer.byteLength(process.env.MDI_EMAIL_TOKEN_HMAC_SECRET, 'utf8') >= 32)
    ? process.env.MDI_EMAIL_TOKEN_HMAC_SECRET
    : '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const rawToken = createHmac('sha256', hmacSecret).update(`mdi-invitation:${applicationId}:${tokenNonce}`).digest('hex').toUpperCase();
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

export type DirectProvisionResult = {
  success: boolean;
  error?: string;
  data?: {
    tenant_id: string;
    user_id: string;
    email: string;
    institution_name: string;
    subdomain: string;
    is_new_user: boolean;
    activated: boolean;
    password_used: string | null;
  };
};

export async function directProvisionTenant(params: {
  applicationId: string;
  initialPassword?: string;
  activateImmediately?: boolean;
}): Promise<DirectProvisionResult> {
  try {
    const { supabase } = await requirePlatformOwner();
    const { applicationId, initialPassword, activateImmediately = true } = params;

    if (!/^[0-9a-f-]{36}$/i.test(applicationId)) {
      return { success: false, error: 'অবৈধ আবেদন সনাক্তকারী (Invalid application ID)।' };
    }

    const { data, error } = await (supabase.rpc as any)('owner_direct_setup_madrasa_admin', {
      p_application_id: applicationId,
      p_initial_password: initialPassword?.trim() || null,
      p_activate_immediately: activateImmediately,
    });

    if (error) {
      console.error('owner_direct_setup_madrasa_admin error:', error);
      return { success: false, error: error.message || 'অ্যাকাউন্ট সরাসরি সেটআপ করা যায়নি।' };
    }

    revalidatePath('/platform');
    return { success: true, data };
  } catch (err: any) {
    console.error('directProvisionTenant failed:', err);
    return { success: false, error: err?.message || 'সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' };
  }
}

