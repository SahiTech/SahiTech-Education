import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const appRoot = process.cwd();
const readApp = (path) => readFile(resolve(appRoot, path), 'utf8');
const readRepo = (path) => readFile(resolve(appRoot, '../..', path), 'utf8');

const [form, platformActions, ownerPage, authActions, middleware, authContext, migration, adminClient] = await Promise.all([
  readApp('src/app/platform/(owner)/direct-provision-form.tsx'),
  readApp('src/app/actions/platform.ts'),
  readApp('src/app/platform/(owner)/page.tsx'),
  readApp('src/app/actions/auth.ts'),
  readApp('src/lib/supabase/middleware.ts'),
  readApp('src/lib/auth/context.ts'),
  readRepo('packages/database/migrations/00046_secure_manual_madrasa_admin_activation.sql'),
  readApp('src/lib/supabase/admin.ts'),
]);

test('manual provisioning never generates or accepts a client-side password', () => {
  assert.doesNotMatch(form, /Math\.random\s*\(/);
  assert.doesNotMatch(form, /initialPassword/);
  assert.match(form, /provisionMadrasaAdminManually/);
  assert.match(form, /resetMadrasaAdminPasswordManually/);
});

test('temporary credentials are generated server-side with cryptographic randomness', () => {
  assert.match(platformActions, /randomBytes\(32\)/);
  assert.match(platformActions, /randomBytes\(16\)/);
  assert.match(platformActions, /auth\.admin\.createUser/);
  assert.match(platformActions, /email_confirm:\s*true/);
  assert.match(platformActions, /login\.sahitech\.invalid/);
  assert.doesNotMatch(platformActions, /Sahitech@2026!/);
  assert.doesNotMatch(platformActions, /password_used/);
});

test('Auth Admin client is server-only and reads the service role key privately', () => {
  assert.match(adminClient, /import ['"]server-only['"]/);
  assert.match(adminClient, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(adminClient, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});

test('real applicant contact email is not marked verified by manual provisioning', () => {
  assert.match(platformActions, /mdi_contact_email_verified:\s*false/);
  assert.match(form, /contact_email_verified/);
  assert.match(migration, /'contact_email_verified', FALSE/);
  assert.doesNotMatch(migration, /UPDATE\s+auth\.users/i);
  assert.doesNotMatch(migration, /INSERT\s+INTO\s+auth\.users/i);
  assert.doesNotMatch(migration, /INSERT\s+INTO\s+auth\.identities/i);
});

test('first-login password change is enforced in app and database paths', () => {
  assert.match(authActions, /changeInitialMadrasaAdminPassword/);
  assert.match(authActions, /mdi_force_password_change:\s*false/);
  assert.match(authActions, /record_manual_admin_password_change/);
  assert.match(middleware, /mdi_manual_password_change_required/);
  assert.match(authContext, /mdi_manual_password_change_required/);
  assert.match(migration, /private\.can_use_mdi_tenant_features/);
  assert.match(migration, /public\.mdi_manual_password_change_required/);
  assert.match(migration, /mdi_force_password_change/);
});

test('old direct provisioning RPC is removed and no password fallback remains', () => {
  assert.match(migration, /DROP FUNCTION IF EXISTS public\.owner_direct_setup_madrasa_admin/i);
  assert.doesNotMatch(migration, /Sahitech@2026!/);
  assert.doesNotMatch(migration, /password_used/);
  assert.doesNotMatch(platformActions, /Sahitech@2026!/);
});

test('invitation token HMAC configuration fails closed rather than using a fallback', () => {
  assert.match(platformActions, /if\s*\(!hmacSecret\s*\|\|\s*Buffer\.byteLength\(hmacSecret,\s*'utf8'\)\s*<\s*32\)/);
  assert.doesNotMatch(platformActions, /0123456789abcdef0123456789abcdef/);
  assert.doesNotMatch(ownerPage, /0123456789abcdef0123456789abcdef/);
});

test('manual password recovery requires explicit verification and audit state', () => {
  assert.match(platformActions, /verificationMethod/);
  assert.match(platformActions, /verificationNote/);
  assert.match(migration, /phone_call.*in_person.*signed_authorization/s);
  assert.match(migration, /manual_password_reset_rate_limited/);
  assert.match(migration, /tenant\.manual_admin_password_reset_completed/);
});

test('manual provisioning workflow is protected by Owner authorization and rate limits', () => {
  assert.match(platformActions, /requirePlatformOwner/);
  assert.match(platformActions, /aal\?\.currentLevel !== 'aal2'/);
  assert.match(migration, /private\.is_platform_owner\(\)/);
  assert.match(migration, /manual_provisioning_rate_limited/);
  assert.match(migration, /INTERVAL '15 minutes'/i);
});
