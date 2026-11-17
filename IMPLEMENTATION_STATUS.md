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
