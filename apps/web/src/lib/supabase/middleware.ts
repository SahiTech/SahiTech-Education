import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verify auth token (refreshes if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Tenant selection is resolved from the authenticated user's active membership
  // and a server-issued m_active_tenant cookie. Do not infer tenants from arbitrary
  // host labels: the production root sahitech.dpdns.org has three DNS labels and is
  // the platform host, not a Madrasa subdomain. Custom-domain routing remains a
  // separately configured capability and is not inferred from request.host.

  // The database-backed gate catches Owner-assisted resets even when the current
  // access token contains stale app_metadata. Only MDI manual-admin identities
  // need this additional round-trip; unrelated users keep the existing fast path.
  const pathname = request.nextUrl.pathname;
  let requiresInitialPasswordChange = false;
  if (user?.app_metadata?.mdi_manual_madrasa_admin === true) {
    const { data: passwordChangeRequired, error: passwordGateError } =
      await (supabase.rpc as any)('mdi_manual_password_change_required');
    requiresInitialPasswordChange = passwordGateError ? true : passwordChangeRequired === true;
  }

  if (user && requiresInitialPasswordChange
      && pathname !== '/first-login-password'
      && !pathname.startsWith('/_next/')
      && !pathname.startsWith('/api/')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/first-login-password';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !requiresInitialPasswordChange && pathname === '/first-login-password') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  // Route protection
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/portals') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/select-tenant');
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/forgot-password');

  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Pending tenants may access onboarding only. Academic, finance and other
  // operational portals remain unavailable until the Global Owner activates them.
  const isTenantOperationalPath = pathname.startsWith('/dashboard') || pathname.startsWith('/portals');
  if (user && isTenantOperationalPath) {
    let membershipQuery = supabase
      .from('tenant_users')
      .select('tenant_id, tenants:tenants!tenant_users_tenant_id_fkey ( platform_status )')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const selectedTenantId = request.cookies.get('m_active_tenant')?.value;
    if (selectedTenantId) {
      membershipQuery = membershipQuery.eq('tenant_id', selectedTenantId);
    }

    const { data: memberships } = await membershipQuery;
    const selectedMembership = selectedTenantId
      ? memberships?.[0]
      : memberships?.length === 1 ? memberships[0] : null;
    const tenant = selectedMembership?.tenants as { platform_status?: string } | null;
    if (tenant?.platform_status === 'pending_activation') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/onboarding';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

