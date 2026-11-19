import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const middleware = read('src/lib/supabase/middleware.ts');
const authContext = read('src/lib/auth/context.ts');
const authActions = read('src/app/actions/auth.ts');
const navbar = read('src/components/Navbar.tsx');
const sidebar = read('src/components/Sidebar.tsx');
const logoutButton = read('src/components/WorkspaceLogoutButton.tsx');
const tenantSelector = read('src/app/select-tenant/page.tsx');

test('platform root host is never guessed to be a tenant subdomain', () => {
  assert.doesNotMatch(middleware, /host\.split\(['"]\.['"]\)/);
  assert.doesNotMatch(middleware, /resolvedTenantSubdomain/);
  assert.doesNotMatch(middleware, /x-tenant-subdomain/);
  assert.match(middleware, /root sahitech\.dpdns\.org/);
});

test('middleware resolves tenant lifecycle through the declared tenant foreign key', () => {
  assert.match(middleware, /tenants:tenants!tenant_users_tenant_id_fkey/);
  assert.doesNotMatch(middleware, /tenants:tenant_id/);
});

test('login derives tenant selection only from the authenticated user active memberships', () => {
  assert.match(authActions, /signInWithPassword/);
  assert.match(authActions, /\.select\('tenant_id'\)/);
  assert.match(authActions, /\.eq\('user_id', data\.user\.id\)/);
  assert.match(authActions, /\.eq\('is_active', true\)/);
  assert.match(authActions, /cookieStore\.set\('m_active_tenant'/);
  assert.match(authActions, /selectableMemberships\.length > 1/);
  assert.match(authActions, /redirect\('\/select-tenant'\)/);
  assert.match(authActions, /httpOnly:\s*true/);
  assert.match(authActions, /secure:\s*process\.env\.NODE_ENV === 'production'/);
});

test('tenant selector rechecks membership and tenant lifecycle on the server', () => {
  assert.match(tenantSelector, /tenants:tenants!tenant_users_tenant_id_fkey/);
  assert.match(authActions, /selectTenantForCurrentUser/);
  assert.match(authActions, /\.eq\('user_id', user\.id\)/);
  assert.match(authActions, /\.eq\('tenant_id', tenantId\)/);
  assert.match(authActions, /tenant\.platform_status !== 'pending_activation'/);
});

test('active tenant context fails closed for a stale or ambiguous tenant selection', () => {
  assert.match(authContext, /activeTenantCookie/);
  assert.match(authContext, /tenantQuery\.eq\('tenant_id', activeTenantCookie\)/);
  assert.match(authContext, /memberships\.length !== 1/);
  assert.doesNotMatch(authContext, /x-tenant-subdomain/);
});

test('workspace logout signs out and clears the selected tenant cookie', () => {
  assert.match(logoutButton, /action=\{signOutUser\}/);
  assert.match(authActions, /await supabase\.auth\.signOut\(\)/);
  assert.match(authActions, /cookieStore\.delete\('m_active_tenant'\)/);
  assert.match(authActions, /redirect\('\/login'\)/);
});

test('tenant workspace has logout controls on desktop and mobile while Owner shell stays separate', () => {
  assert.match(navbar, /WorkspaceLogoutButton/);
  assert.match(navbar, /if \(isPlatformRoute\) return null/);
  assert.match(sidebar, /WorkspaceLogoutButton/);
  assert.match(sidebar, /মাদরাসা নেভিগেশন/);
});
