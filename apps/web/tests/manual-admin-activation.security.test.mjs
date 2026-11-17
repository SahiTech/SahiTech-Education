import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const route = read('src/app/api/platform/provision/route.ts');
const recovery = read('src/app/api/platform/recover/route.ts');
const adminClient = read('src/lib/supabase/admin.ts');
const middleware = read('src/lib/supabase/middleware.ts');
const authAction = read('src/app/actions/auth.ts');
const form = read('src/app/platform/(owner)/direct-provision-form.tsx');
const migration = read('../../packages/database/migrations/00045_owner_direct_setup_madrasa_admin.sql');
const platformActions = read('src/app/actions/platform.ts');
const ownerPage = read('src/app/platform/(owner)/page.tsx');
const applicationActions = read('src/app/actions/applications.ts');

test('temporary credentials are generated only with cryptographic randomness', () => {
  assert.match(route, /randomBytes\(12\)/);
  assert.match(route, /randomBytes\(32\)/);
  assert.doesNotMatch(route + form, /Math\.random\s*\(/);
});

test('manual login uses a platform-owned alias and leaves the applicant contact email unverified', () => {
  assert.match(route, /@accounts\.sahitech\.invalid/);
  assert.match(route, /email_confirm:\s*true/);
  assert.match(route, /mdi_contact_email_verified:\s*false/);
  assert.match(migration, /contact_email_verified/);
  assert.match(migration, /contact_email_verified,manual_admin_provisioned/);
  assert.match(migration, /v_app\.contact_email,FALSE,TRUE,/);
});

test('temporary credentials are not persisted or returned by database functions', () => {
  assert.doesNotMatch(migration, /password_used|Sahitech@2026|INSERT\s+INTO\s+auth\.users|UPDATE\s+auth\.users/i);
  assert.doesNotMatch(platformActions, /directProvisionTenant|password_used|owner_direct_setup_madrasa_admin/);
  assert.match(route, /Cache-Control':\s*'no-store, no-cache, must-revalidate, private'/);
});

test('privileged Supabase Auth client is server-only and uses only server environment secrets', () => {
  assert.match(adminClient, /import 'server-only'/);
  assert.match(adminClient, /SUPABASE_SERVICE_ROLE_KEY\s*\|\|\s*process\.env\.SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(adminClient, /NEXT_PUBLIC_.*SERVICE_ROLE|NEXT_PUBLIC_.*SECRET/);
});

test('manual provisioning and recovery require an AAL2 Global Owner session', () => {
  assert.match(route, /currentLevel !== 'aal2'/);
  assert.match(route, /'is_platform_owner'/);
  assert.match(recovery, /currentLevel !== 'aal2'/);
  assert.match(recovery, /'is_platform_owner'/);
  assert.match(migration, /NOT private\.is_platform_owner\(\)/);
});

test('manual accounts are gated until first-login password change completes', () => {
  assert.match(middleware, /mdi_force_password_change === true/);
  assert.match(middleware, /pathname !== '\/change-password'/);
  assert.match(authAction, /mdi_force_password_change: false/);
  assert.match(authAction, /auth\.admin\.updateUserById/);
});

test('manual recovery requires a reason and renewed out-of-band contact verification', () => {
  assert.match(recovery, /reason\.length < 20/);
  assert.match(recovery, /manualContactVerified !== true/);
  assert.match(migration, /owner_prepare_manual_admin_recovery/);
  assert.match(migration, /tenant\.manual_admin_recovery_requested/);
  assert.match(migration, /tenant\.manual_admin_recovery_succeeded/);
});

test('invitation signing fails closed when the HMAC secret is absent', () => {
  assert.match(platformActions, /Secure invitation signing is not configured/);
  assert.doesNotMatch(platformActions + ownerPage + applicationActions, /0123456789abcdef0123456789abcdef|DEFAULT_HMAC_SECRET/);
  assert.doesNotMatch(applicationActions, /NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(applicationActions, /নিরাপদ application upload ব্যবস্থা প্রস্তুত নয়/);
});
