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
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();

  // 1. Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name_en, full_name_bn, phone')
    .eq('id', user.id)
    .single();

  // 2. Determine target tenant
  // Check cookie override or resolve from subdomain
  const cookieStore = await cookies();
  const activeTenantCookie = cookieStore.get('m_active_tenant')?.value;
  const headerStore = await headers();
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
        is_active
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (activeTenantCookie) {
    tenantQuery = tenantQuery.eq('tenant_id', activeTenantCookie);
  }

  const { data: memberships, error } = await tenantQuery;
  if (error || !memberships || memberships.length === 0) {
    // If no specific tenant matched, pick first active membership
    const { data: fallbackMemberships } = await supabase
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
          is_active
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    if (!fallbackMemberships || fallbackMemberships.length === 0) {
      return null;
    }

    const first = fallbackMemberships[0];
    const tenantData = first.tenants as any;
    return {
      userId: user.id,
      userEmail: user.email || '',
      fullName: profile?.full_name_bn || profile?.full_name_en || user.email || 'ব্যবহারকারী',
      tenantId: first.tenant_id,
      tenantName: tenantData?.name || 'মাদরাসা',
      tenantCode: tenantData?.code || 'MDI',
      role: first.role as UserRole,
      curriculumType: tenantData?.curriculum_type || 'qawmi',
    };
  }

  const active = memberships[0];
  const tenantData = active.tenants as any;

  return {
    userId: user.id,
    userEmail: user.email || '',
    fullName: profile?.full_name_bn || profile?.full_name_en || user.email || 'ব্যবহারকারী',
    tenantId: active.tenant_id,
    tenantName: tenantData?.name || 'মাদরাসা',
    tenantCode: tenantData?.code || 'MDI',
    role: active.role as UserRole,
    curriculumType: tenantData?.curriculum_type || 'qawmi',
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

