import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const provisionRoute = read('src/app/api/platform/provision/route.ts');
const recoveryRoute = read('src/app/api/platform/recover/route.ts');
const adminClient = read('src/lib/supabase/admin.ts');
const middleware = read('src/lib/supabase/middleware.ts');
const authAction = read('src/app/actions/auth.ts');
const authContext = read('src/lib/auth/context.ts');
const form = read('src/app/platform/(owner)/direct-provision-form.tsx');
const migration45 = read('../../packages/database/migrations/00045_owner_direct_setup_madrasa_admin.sql');
const migration46 = read('../../packages/database/migrations/00046_secure_manual_madrasa_admin_activation.sql');
const migration47 = read('../../packages/database/migrations/00047_manual_admin_contact_verification_and_recovery_scope.sql');
const platformActions = read('src/app/actions/platform.ts');
const ownerPage = read('src/app/platform/(owner)/page.tsx');
const applicationActions = read('src/app/actions/applications.ts');
const firstLoginPage = read('src/app/first-login-password/page.tsx');

test('temporary credentials use cryptographic randomness and a non-routable MDI login alias', () => {
  assert.match(provisionRoute, /randomBytes\(16\)/);
  assert.match(provisionRoute, /randomBytes\(32\)/);
  assert.match(recoveryRoute, /randomBytes\(32\)/);
  assert.match(provisionRoute, /@login\.sahitech\.invalid/);
  assert.doesNotMatch(provisionRoute + recoveryRoute + form, /Math\.random\s*\(/);
});

test('applicant contact email is not confirmed by manual activation', () => {
  assert.match(provisionRoute, /email_confirm:\s*true/); // Only the MDI-issued alias is confirmed.
  assert.match(provisionRoute, /mdi_contact_email_verified:\s*false/);
  assert.match(migration46, /contact_email_verified.*FALSE/s);
  assert.match(migration47, /contact_email_verified\s*:=\s*FALSE/);
  assert.match(form, /এই ইমেইলটি Supabase Auth-এ Verified করা হবে না/);
});

test('provisioning is reservation-based, idempotent, and server-admin only', () => {
  assert.match(provisionRoute, /owner_reserve_manual_admin_provisioning/);
  assert.match(provisionRoute, /owner_complete_manual_admin_provisioning/);
  assert.match(provisionRoute, /owner_fail_manual_admin_provisioning/);
  assert.match(migration46, /INTERVAL '15 minutes'/i);
  assert.match(migration46, /manual_provisioning_already_in_progress/);
  assert.match(migration46, /attempt_count >= 3/);
  assert.match(adminClient, /import 'server-only'/);
  assert.match(provisionRoute, /admin\.auth\.admin\.createUser/);
});

test('temporary credentials are not persisted in SQL or returned by Server Actions', () => {
  assert.doesNotMatch(migration45 + migration46 + migration47, /password_used|Sahitech@2026!/);
  assert.doesNotMatch(migration45 + migration46 + migration47, /INSERT\s+INTO\s+auth\.users|UPDATE\s+auth\.users/i);
  assert.doesNotMatch(platformActions, /provisionMadrasaAdminManually|resetMadrasaAdminPasswordManually|temporary_password/);
  assert.match(provisionRoute + recoveryRoute, /Cache-Control/);
  assert.match(provisionRoute + recoveryRoute, /no-store/);
});

test('provisioning and recovery require the MFA-verified Global Platform Owner', () => {
  for (const source of [provisionRoute, recoveryRoute]) {
    assert.match(source, /currentLevel !== 'aal2'/);
    assert.match(source, /'is_platform_owner'/);
    assert.match(source, /request\.headers\.get\('origin'\)/);
  }
  assert.match(migration46, /NOT private\.is_platform_owner\(\)/);
  assert.match(migration47, /NOT private\.is_platform_owner\(\)/);
});

test('initial provisioning records explicit out-of-band identity verification', () => {
  assert.match(form, /manualContactVerified/);
  assert.match(form, /verificationNote/);
  assert.match(provisionRoute, /verificationNote\.length < 20/);
  assert.match(provisionRoute, /p_contact_verification_method/);
  assert.match(provisionRoute, /p_contact_verification_note/);
  assert.match(migration47, /contact_verification_method/);
  assert.match(migration47, /contact_verification_note/);
  assert.match(migration47, /tenant\.manual_admin_provisioning_reserved/);
});

test('first-login password change is enforced by the database-backed gate', () => {
  assert.match(middleware, /mdi_manual_password_change_required/);
  assert.match(middleware, /pathname !== '\/first-login-password'/);
  assert.match(authContext, /mdi_manual_password_change_required/);
  assert.match(authAction, /mdi_manual_password_change_required/);
  assert.match(authAction, /record_manual_admin_password_change/);
  assert.match(migration46, /private\.can_use_mdi_tenant_features/);
  assert.match(migration46, /public\.mdi_manual_password_change_required/);
  assert.match(firstLoginPage, /mdi_manual_password_change_required/);
});

test('manual recovery cannot reset invitation-created or unrelated administrator accounts', () => {
  assert.match(recoveryRoute, /mdi_manual_madrasa_admin === true/);
  assert.match(recoveryRoute, /@login\\.sahitech\\.invalid/);
  assert.match(migration47, /manual_admin_provisioned=TRUE/);
  assert.match(migration47, /JOIN private\.manual_admin_provisionings mp/);
  assert.match(migration47, /mp\.auth_user_id=tu\.user_id/);
  assert.match(migration47, /mdi_manual_madrasa_admin/);
  assert.match(migration46, /manual_password_reset_rate_limited/);
});

test('existing Auth users at applicant contact email are protected from takeover', () => {
  assert.match(migration46, /owner_reserve_manual_admin_provisioning/);
  assert.match(migration46, /manual_login_identifier_already_exists/);
  assert.match(provisionRoute, /admin\.auth\.admin\.createUser/);
  assert.doesNotMatch(provisionRoute, /updateUserById\(.*application\.contact_email/s);
});

test('invitation and application upload token signing fail closed without a strong HMAC secret', () => {
  assert.match(platformActions, /Secure invitation delivery is not configured/);
  assert.doesNotMatch(platformActions + ownerPage + applicationActions, /0123456789abcdef0123456789abcdef|DEFAULT_HMAC_SECRET/);
  assert.doesNotMatch(applicationActions, /NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(applicationActions, /নিরাপদ application upload ব্যবস্থা প্রস্তুত নয়/);
});

