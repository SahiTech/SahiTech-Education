# MDI Implementation & Verification Status

**Last reviewed:** 2026-11-17  
**Repository:** SahiTech/SahiTech-Education  
**Reviewed ref:** `main` at `aaaf802d4c4f85b7982410d346ece201201116b4`  
**Review type:** GitHub source-tree and documentation inspection only  
**Production release status:** NOT VERIFIED — do not infer production readiness from this document

> This file is a dated evidence snapshot, not a live connection to Supabase or Vercel. The current code and migrations are source evidence only. No production database, Auth configuration, runtime logs, deployed site, or browser session was accessed for this review.

## 1. Evidence summary

| Area | Source evidence at reviewed ref | Verification status |
|---|---|---|
| Web app | `apps/web` uses Next.js App Router, React 19, TypeScript and Tailwind CSS | Source inspected; runtime not verified |
| Domain logic | `packages/domain` contains academic, finance, tenancy/RBAC and SIS TypeScript modules | Source inspected; test execution not performed in this review |
| Database | `packages/database/migrations` contains ordered migration files through `00045` | Repository files inspected; applied dev/prod migration state not verified |
| Database security smoke test | `packages/database/tests/platform_security_smoke.sql` exists and contains assertions/rollback-only probes | Not run in this review; comments specify historical migration baseline 00001–00030 |
| i18n | Runtime i18n imports TypeScript dictionaries for `bn`, `en`, `ar` | Source inspected; locale completeness and browser RTL not tested |
| Public homepage | Server-rendered homepage, shared Navbar, registration and Sanad verification route links | Source inspected; live route behavior not tested |
| Owner workflow | Platform routes/actions and owner-related migrations exist in repository | Source inspected; live MFA, Auth and lifecycle not tested |
| Email outbox | Edge Function source and setup documentation exist | End-to-end delivery not verified; sender/provider readiness not asserted |
| PWA/offline | A target design is documented | No complete service-worker/IndexedDB offline workflow verified in inspected tree |
| AI/OCR | A target architecture is documented | No production AI/OCR workflow verified |
| CI | `.github/workflows/mdi-ci.yml` defines Node 22, pnpm 12.18.0, tests, web typecheck/lint/build | Workflow source inspected; latest run status not checked in this review |
| Production | Historical docs contain prior environment snapshots | Current deployment/database state not independently verified |

## 2. Repository facts

The checked-in root manifest specifies pnpm 12.18.0. The web manifest specifies Next.js 15.x, React 19, Supabase JS/SSR and Tailwind CSS 3.4.x. The exact installed versions are defined by the lockfile, not version badges or this prose.

Current workspace packages found:
- `apps/web` — web application
- `packages/domain` — pure TypeScript domain package
- `packages/database` — database client and migration package
- `supabase/functions` — Edge Function source

There is no separate `@sahitech/ui` workspace package in the reviewed tree.

The repository includes migration files through `00045`. This does not mean that all migrations are applied to any particular database. Migration `00007_security_hardening.sql` is historically documented as excluded from the accepted owner/tenant path; reconcile the actual environment migration ledger before proposing any deployment.

## 3. Current public-site implementation snapshot

The homepage at `apps/web/src/app/page.tsx`:
- loads server-side translations through `getServerDictionary()`;
- uses the existing campus and geometric-pattern image assets;
- links to `/register-madrasa` and `/verify`;
- presents capability cards and academic pathway content;
- relies on the shared Navbar and root layout.

No live prayer-time calculation, Qibla utility, Hijri widget, newsletter delivery backend or editorial publishing workflow was verified in the homepage source. These remain optional future requirements, not live features.

## 4. Important security review item

Migration `00045_owner_direct_setup_madrasa_admin.sql` contains a static fallback password path for newly created admin accounts and returns a response field containing the password used in certain cases. This is a source-level security blocker. Do not use this path for production onboarding until it is replaced with a secure invitation/verified-reset flow, the function is reviewed, and regression tests confirm no secret is returned or logged.

This documentation review did not modify migrations, application code, Supabase settings or production data.

## 5. Known verification gaps

- Verify current applied migrations separately in development and production.
- Inspect effective RLS policies, grants, views, function execution grants and Storage policies in the live database.
- Run the SQL smoke test only against an isolated database whose schema matches the test's stated assumptions; update/parameterize it before treating it as a current full-schema test.
- Replace the database package's placeholder `test` script with real database checks; do not report the echo as database validation.
- Add browser E2E coverage for public application, document upload, owner MFA/review, invitation acceptance, onboarding and tenant isolation.
- Verify actual email delivery only after a verified sender and secure secrets are configured.
- Review all locale dictionaries for key parity, visual wrapping, Arabic RTL and keyboard accessibility.
- Review transaction boundaries for multi-step admission/provisioning and financial posting; domain validators alone do not guarantee atomicity or database immutability.
- Complete backup/restore and production release rehearsal with explicit approvals.

## 6. Required status-update format

Every future update must include:
1. Reviewed commit/ref and date.
2. Exact commands, CI run IDs, database environment, or browser workflow used as evidence.
3. What passed, failed, or was not run.
4. Clear separation between source implementation, development verification and production verification.
5. Remaining risks, owner approvals and release blockers.

Never restore a “production-ready” label based only on a successful build or a migration file.


---

## 2026-11-17 current security-branch evidence update

**Reviewed branch:** security/manual-admin-activation  
**Source scope:** PR #15 and current migration files through 00052  
**Evidence date:** 2026-11-17  
**Production release status:** NOT READY

| Area | Current evidence | Status |
|---|---|---|
| Manual Madrasa Admin activation | Server-side Auth Admin provisioning, reservation/finalization, out-of-band contact verification, encrypted single-use credentials, forced first-login password change and manual-only recovery in PR #15 | Source implemented |
| Manual-admin Owner RPCs | Migrations 00046–00050 enforce database AAL2, reservations, rate limits and one-time credential handoff | Source implemented |
| Legacy direct-admin RPC | Emergency migration 00051 applied to Development and Production; read-only Production catalog query confirmed old password-bearing RPC absent | Production mitigation verified |
| Legacy direct-tenant path and lifecycle AAL2 | Migration 00052 applied to Development and Production; read-only Production checks confirm the old direct-tenant RPC is absent and four lifecycle Owner RPCs have AAL2 guards | Production hotfix verified; manual-admin feature pending |
| Owner RPC regression SQL | packages/database/tests/owner_rpc_aal2_security_smoke.sql executed successfully against isolated Development after 00052 | Development verified |
| GitHub CI | CI run 44096861056 passed for commit f692b433de021f6ebec7a8ca762c18762ebdb696; later documentation-only commits triggered a new current-head run | CI passed for source/test head; current-head run pending at this snapshot |
| Homepage performance | PR #12 merged as caf3289a0851f7d99428002ded6944fc3f6c99a2; Vercel Production status success | Production deployment verified; measured PageSpeed/Core Web Vitals improvement not verified |
| Secure app Preview | Vercel Preview dpl_EcVJpg7E5N3nFsoQpwNsytsvFvRx READY for commit d3eb21c18812a946e5c01933a406976bba82293b, with branch-scoped Development Supabase URL/client key and credential-display key | Preview deployment verified; current documentation head not rebuilt |
| Production migrations | Production ledger has 00044, emergency 00051 and security hotfix 00052; feature migrations 00045–00050 remain pending | Partial Production verification; feature release not complete |
| Supabase Auth E2E | Real manual account creation/login/first-password-change/recovery not run | Not verified |
| Production secrets | SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY and MDI_EMAIL_TOKEN_HMAC_SECRET are absent from Vercel Production | User configuration required |
| Backup/restore and Auth security settings | Production restore readiness and leaked-password-protection setting remain unverified/disabled per Security Advisor | Not verified |

The Production database must not be represented as having the full secure manual activation workflow until migrations, server-only configuration, real Auth E2E and live smoke tests are complete. The old direct-provision path is intentionally not restored.

---

## Production lifecycle security hotfix — 2026-11-17

**Production project:** sahitech-mdi (xbswamfmslhliayoowlo)  
**Applied migration:** 00052_retire_legacy_owner_direct_provision_and_enforce_lifecycle_aal2  
**Verification:** read-only SQL executed after migration application

| Check | Production result |
|---|---|
| Legacy owner_direct_provision_tenant(UUID,UUID) | Absent |
| owner_activate_tenant database AAL2 guard | Present |
| owner_issue_invitation database AAL2 guard | Present |
| owner_review_application_document database AAL2 guard | Present |
| owner_update_application_status database AAL2 guard | Present |
| Lifecycle RPC count verified | 4 |

Production migration ledger now has 00044, emergency 00051 and security hotfix 00052. Feature migrations 00045–00050 remain pending. This is a Production-verified lifecycle hardening hotfix only; it is not evidence that the manual-admin provisioning workflow is active.

Development also has migration 00052 and its eleven-RPC read-only smoke test passed. The Development ledger has two rows named 00052 from repeat application of the idempotent migration. Do not delete migration history manually; reconcile before any future CLI push.

The secure Admin workflow still requires the feature migrations 00045–00050, server-only Auth Admin key, matching HMAC secret, real Auth E2E, final Preview/Production checks and post-deployment smoke testing.


---

## 2026-11-19 — First-login password update root-cause and fix

**Investigation environment:** Production Supabase project `xbswamfmslhliayoowlo`; Production Vercel deployment `dpl_FZ6NYSmCpX8yaqsNppv85aSCNZgi`  
**Source baseline:** `a69de3e944589a4073dd0f3bfe7963813b238378`  
**Evidence:** Supabase Auth logs recorded six `current_password_required` HTTP 400 responses on 2026-11-19 between 12:21:22Z and 12:25:38Z. The deployed Server Action called `auth.updateUser({ password })` without `current_password`; the form did not collect the Owner-issued temporary password. The database-backed first-login gate remained true and no password-change audit event was created.  
**Fix branch:** `fix/first-login-current-password`

| Area | Change / evidence | Status |
|---|---|---|
| Root cause | Supabase Auth current-password policy rejected the new-password request because the current temporary password was not supplied | Production log-confirmed |
| Server Action | Adds bounded temporary-password input handling, passes `current_password` to Supabase Auth, maps known provider error codes without logging passwords | Source implemented; verification pending |
| First-login form | Adds Owner-issued temporary-password field with current-password autocomplete | Source implemented; verification pending |
| Regression coverage | Adds assertions for current-password UI, Auth payload and error mapping | Source implemented; CI pending |
| Security documentation and changelog | Updated first-login credential flow and release notes | Source implemented |
| Development verification | CI, Development Preview and authenticated end-to-end password change | Pending |
| Production release | No Production code deployment or Auth/Database configuration change made during investigation | Pending explicit release gate |

The fix preserves Supabase's current-password policy; it does not disable or weaken Auth security settings. Temporary and new passwords must never be written to logs, telemetry, database audit records, or documentation.


---

## 2026-11-19 — Dashboard active-tenant context investigation

**Production evidence:** The signed-in manual Madrasa Admin has one active `tenant_users` membership (`role=madrasa_admin`) linked to an active, verified tenant (`platform_status=active`, onboarding step 6/6). The tenant is `Taste Madrasa One`. The user account's first-login password-change gate is false.

**Root cause in source:** `apps/web/src/lib/auth/context.ts` embedded the tenant relation as `tenants:tenant_id (...)`. The actual foreign key on `public.tenant_users` is `tenant_users_tenant_id_fkey`, referencing `tenants(id)`. The relation hint must identify the related table and declared foreign key; the prior hint named the scalar `tenant_id` column, causing tenant-context resolution to return null and the dashboard to render the misleading “No Active Madrasa Found” empty state.

**Fix branch:** `fix/dashboard-tenant-context-resolution`

| Area | Change / status |
|---|---|
| Tenant membership and tenant active state | Confirmed read-only in Production |
| Tenant embed relationship | Corrected to `tenants:tenants!tenant_users_tenant_id_fkey` |
| Regression test | Added source assertion for explicit FK relationship and active membership filter |
| Development/Preview verification | Pending CI and Preview |
| Production deployment | Not yet performed for this dashboard fix |
| Database/Auth changes | None required or performed |

The fail-closed behavior for invalid tenant-selection cookies and multiple memberships is intentionally preserved; no tenant fallback or cross-tenant access was introduced.
---

## 2026-11-19 — Workspace tenant routing and logout correction

**Production baseline:** Vercel deployment `dpl_8bPH9KvWBr9UciwFwFuVVGb9cCLF`, commit `23df6b46b1c7bb4d08c7f789952e619769c14b47`.
**Database evidence:** Production Admin identity has one active `madrasa_admin` membership for active, verified tenant `Taste Madrasa One` (code `TAS-02`).
**Source diagnosis:** Middleware inferred a tenant subdomain from the first hostname label whenever the host had more than two labels. Thus the platform root `sahitech.dpdns.org` could be misread as tenant subdomain `sahitech`. The tenant context also depended on a selection cookie which the ordinary email/password sign-in action did not initialize. Workspace navigation had no sign-out control even though a Server Action existed.

**Fix branch:** `fix/workspace-tenant-routing-and-logout`

| Area | Source change | Verification state |
|---|---|---|
| Host routing | Removed arbitrary hostname-label tenant inference; fixed Middleware tenant embed to the declared FK | Source implemented; CI pending |
| Sign-in tenant selection | Clear stale selection, query only authenticated user's active membership rows, set Secure/HttpOnly cookie for a sole membership | Source implemented; CI pending |
| Multiple memberships | Added server-verified `/select-tenant` page and selection action | Source implemented; CI pending |
| Tenant context | Resolve from selected cookie or sole active membership; preserve fail-closed validation | Source implemented; CI pending |
| Workspace Logout | Shared control in desktop Navbar, mobile navigation and workspace Sidebar; sign-out removes selection cookie | Source implemented; CI pending |
| Global Owner shell | Existing restricted Owner layout and Owner logout remain separate and unchanged | Source inspection |
| Database/Auth/DNS | No Production schema, data, Auth settings, secrets or DNS changes in this change | Confirmed no change |
| Development/Preview and Production verification | CI, Preview deployment, Production deployment and authenticated manager browser test | Pending |

No assertion that the manager's Production browser journey is verified should be made until a live authenticated login, dashboard load and logout test completes.
