import { createClient } from '@/lib/supabase/server';
import { hasPermission, Permission, UserRole } from '@sahitech/domain';
import { cookies, headers } from 'next/headers';

export interface TenantContext {
  userId: string;
  userEmail: string;
  fullName: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  role: UserRole;
  curriculumType: string;
}

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getActiveTenantContext(): Promise<TenantContext | null> {
  // Validate the user once, then resolve profile and membership concurrently.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;
  if (user.app_metadata?.mdi_force_password_change === true) return null;

  const [profileResult, cookieStore, headerStore] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name_en, full_name_bn, phone')
      .eq('id', user.id)
      .maybeSingle(),
    cookies(),
    headers(),
  ]);

  // Resolve exactly one explicitly selected tenant, or the sole membership.
  // An invalid tenant cookie must fail closed; never fall back to another tenant.
  const activeTenantCookie = cookieStore.get('m_active_tenant')?.value;
  const subdomainHeader = headerStore.get('x-tenant-subdomain');

  let tenantQuery = supabase
    .from('tenant_users')
    .select(`
      tenant_id,
      role,
      tenants:tenant_id (
        id,
        name,
        code,
        subdomain,
        curriculum_type,
        is_active,
        platform_status
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (activeTenantCookie) {
    tenantQuery = tenantQuery.eq('tenant_id', activeTenantCookie);
  } else if (subdomainHeader) {
    tenantQuery = tenantQuery.eq('tenants.subdomain', subdomainHeader);
  }

  const { data: memberships, error } = await tenantQuery;
  if (error || !memberships || memberships.length === 0) return null;

  // Multiple memberships require an explicit tenant selection.
  if (!activeTenantCookie && !subdomainHeader && memberships.length !== 1) return null;

  const active = memberships[0];
  const tenantData = active.tenants as any;
  // Legacy super_admin is not a tenant role; Global Platform Owner uses a separate identity.
  if (active.role === 'super_admin') return null;
  if (!tenantData || (tenantData.is_active !== true && tenantData.platform_status !== 'pending_activation')) return null;

  const profile = profileResult.data;
  return {
    userId: user.id,
    userEmail: (typeof user.app_metadata?.mdi_contact_email === 'string' ? user.app_metadata.mdi_contact_email : user.email) || '',
    fullName: profile?.full_name_bn || profile?.full_name_en || user.email || 'ব্যবহারকারী',
    tenantId: active.tenant_id,
    tenantName: tenantData.name || 'মাদরাসা',
    tenantCode: tenantData.code || 'MDI',
    role: active.role as UserRole,
    curriculumType: tenantData.curriculum_type || 'qawmi',
  };
}

export async function requirePermission(permission: Permission): Promise<TenantContext> {
  const context = await getActiveTenantContext();
  if (!context) {
    throw new Error('Unauthorized: Authentication required.');
  }

  if (!hasPermission(context.role, permission)) {
    throw new Error(`Forbidden: Role '${context.role}' lacks permission '${permission}'.`);
  }

  return context;
}

