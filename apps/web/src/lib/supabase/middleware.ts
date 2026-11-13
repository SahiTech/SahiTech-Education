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

  // Extract host to determine subdomain/custom domain for multi-tenancy
  const host = request.headers.get('host') || '';
  let resolvedTenantSubdomain: string | null = null;

  // e.g. darululoom.sahitech-edu.com or darululoom.localhost:3000
  const parts = host.split('.');
  if (parts.length > 2 || (host.includes('localhost') && parts.length > 1)) {
    const candidate = parts[0]?.toLowerCase();
    if (candidate && candidate !== 'www' && candidate !== 'app' && candidate !== 'admin') {
      resolvedTenantSubdomain = candidate;
    }
  }

  // Stamp tenant subdomain on response header for Server Components
  if (resolvedTenantSubdomain) {
    supabaseResponse.headers.set('x-tenant-subdomain', resolvedTenantSubdomain);
  }

  // Route protection
  const pathname = request.nextUrl.pathname;
  const isProtectedPath = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/portals') ||
    pathname.startsWith('/onboarding');
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
      .select('tenant_id, tenants:tenant_id ( platform_status )')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const selectedTenantId = request.cookies.get('m_active_tenant')?.value;
    if (selectedTenantId) {
      membershipQuery = membershipQuery.eq('tenant_id', selectedTenantId);
    } else if (resolvedTenantSubdomain) {
      membershipQuery = membershipQuery.eq('tenants.subdomain', resolvedTenantSubdomain);
    }

    const { data: memberships } = await membershipQuery;
    const selectedMembership = selectedTenantId || resolvedTenantSubdomain
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

