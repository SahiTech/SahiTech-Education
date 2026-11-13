'use server';

import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const OWNER_EMAIL = 'helpline.sahitech@gmail.com';

async function requirePlatformOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== OWNER_EMAIL) throw new Error('Global Platform Owner access required.');
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') throw new Error('A verified MFA session is required.');
  const { data: isOwner, error } = await (supabase.rpc as any)('is_platform_owner');
  if (error || isOwner !== true) throw new Error('Global Platform Owner authorization failed.');
  return { supabase, user };
}

export async function updateApplicationStatus(formData: FormData) {
  const { supabase, user } = await requirePlatformOwner();
  const id = String(formData.get('applicationId') || '');
  const status = String(formData.get('status') || '');
  const note = String(formData.get('reviewNote') || '').trim().slice(0, 2000);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['under_review','info_requested','rejected'].includes(status)) {
    throw new Error('Invalid application review request.');
  }
  const { error } = await (supabase.from('madrasa_applications') as any).update({
    status, review_note: note || null, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error('Could not update application review status.');
  revalidatePath('/platform');
}

export async function issueApplicationInvitation(formData: FormData) {
  const { supabase } = await requirePlatformOwner();
  const applicationId = String(formData.get('applicationId') || '');
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) throw new Error('Invalid application.');
  const rawToken = randomBytes(32).toString('hex').toUpperCase();
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sahitech-edu.com').replace(/\/$/, '');
  const invitationUrl = `${origin}/platform/accept?token=${rawToken}`;
  const { error } = await (supabase.rpc as any)('owner_issue_invitation', {
    p_application_id: applicationId,
    p_token_hash: tokenHash,
    p_raw_token: rawToken,
    p_invitation_url: invitationUrl,
  });
  if (error) throw new Error('Invitation could not be issued. Verify that the application has a requested code and subdomain.');
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
