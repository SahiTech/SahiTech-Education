# MDI Engineering Audit (initial repository review)

**Review scope:** tracked GitHub tree and source files at commit `7d08cf2cf42f3688074838d9ea5998350b7bed77` (2026-11-12). The repository source and migration files were inspected; no production database access, deployed runtime, credentials, or browser test environment was available. Therefore this is a source review, not a penetration test or a claim that production is secure.

## Highest-priority confirmed findings

| Severity | Finding | Status |
| --- | --- | --- |
| Critical | `verify_sanad_public` was SECURITY DEFINER and returned student admission number, names, verification token and internal certificate ID to anonymous callers. | Migration 00007 narrows the returned projection and validates token format. **Fixed in source; production unverified.** |
| Critical | An earlier RLS policy made all issued Sanad rows directly selectable by any caller, exposing certificate/student fields independently of the verification RPC. | Migration 00007 removes the named public-read policy. **Fixed in source; production unverified.** |
| High | The public storage policy made `sanad-documents` and `student-documents` readable, while upload authorization checked only `auth.role() = authenticated`, not tenant membership/ownership. Bucket public status also bypasses object RLS. | Migration 00007 makes the certificate/student buckets private and replaces the named broad object policies with tenant-folder membership checks. **Fixed in source, migration application and existing object path compatibility unverified.** |
| High | Tenant administrators could manage all tenant memberships including `super_admin`, and could edit their own membership/role under the original `FOR ALL` policy. | Migration 00007 installs role-limited insert/update/delete policies and a self-edit guard. **Fixed in source; production unverified.** |
| High | Login accepted a caller-supplied redirect path without validating that it was local, allowing open-redirect attempts through the successful sign-in flow. | Fixed in application source by accepting only a single-slash local path. **Source change only.** |
| High | Provisioning, public admission, enrollment, and finance actions perform multi-step writes without database transactions; several follow-up errors are ignored. Provisioning can leave partial tenant records; fee collection can report success when the journal entry failed. | Requires transactional RPCs and workflow-specific regression tests; not changed in this pass to avoid unreviewed workflow/accounting changes. **Further investigation.** |

## Other important audit observations

- Migrations are the only available schema source; no database dump, migration ledger, generated Supabase schema types, or live schema was available for comparison. Thus applied schema state, grants, policies added in the dashboard, constraints, and indexes cannot be confirmed.
- RLS is enabled in the checked-in migrations for the declared tables, but several read policies expose all tenant-member records, including student, guardian, attendance and exam-mark data. Teacher assignment scopes, student self-service, parent-child linkage, and accountant least privilege are not consistently represented in those policies. **Further investigation and tenant-specific policy redesign required.**
- Initial policy expressions use permissive PostgreSQL policies; multiple permissive policies combine with OR. Narrowing or dropping one policy does not prove that no other effective policy or table grant allows access. Verify `pg_policies`, table grants, views, and function grants in the live project.
- `student_guardians` originally allowed anonymous inserts with `WITH CHECK (true)`, and public application submission accepted a caller-provided tenant ID. Public inquiry anti-abuse/rate limits and target-institution validation need a dedicated design. Not changed here because public form workflow and schema compatibility require confirmation.
- The accounting schema defaults journal entries to posted, allows direct line/header mutation, and does not enforce balanced entries or immutable posted vouchers in the database. The application validation alone is bypassable. Add a transactional posting RPC and database invariants only after accounting workflow rules and migration state are confirmed.
- Tenant-bearing foreign keys generally reference row IDs without composite tenant constraints. Cross-tenant related-row mismatches (for example enrollment student/class/year, exam student/subject, guardian student, journal line account) require constraint validation/backfill before adding composite keys.
- Sanad issuance uses `Math.random()` for serial numbers and relies on a deterministic-looking hash helper; the RPC and UI expose more certificate data than needed. Revocation support exists in the enum, but status transitions and append-only audit guarantees need verification.
- Authentication middleware refreshes sessions and protects broad route prefixes, but route middleware is not authorization. Server actions require individual review; role checks, validation, consistent error handling, and rate limiting are uneven. Supabase Auth provider brute-force settings cannot be verified from source.
- UI includes internal implementation claims in landing metrics and a sidebar connection badge (including database version/region and RLS status). The live language dictionaries and full UI were not exhaustively audited. Public GitHub source remains accessible because the repository is public; UI changes do not change source visibility.
- Trilingual dictionaries exist, with RTL direction support and responsive layout classes. No Playwright/browser configuration or viewport suite is present. Every route at 320–1920px, Arabic RTL, keyboard accessibility, and actual overflow remain unverified.
- The repository contains many hand-written `.js`/`.d.ts` files alongside TypeScript sources; the committed generated artifacts may be stale. `packages/database` test script is only an echo, not a database security test.
- Documentation and migration descriptions claim broader academic, financial and security coverage than can be verified from current UI/action implementations. The database package has no deployed-schema type-generation check.

## Changes in this pass

- Added sequential migration `00007_security_hardening.sql` for the confirmed public certificate-read exposure, scoped verification output, tenant membership role restrictions, and tenant-folder scoped storage policy replacement.
- Tightened login redirect handling and normalized sign-in failure messaging.
- No destructive schema changes or existing migration edits were made.

## Verification and rollout checklist

1. Review/apply migration 00007 in a staging Supabase project first. Check policy names and storage object path conventions against the deployed project before production.
2. Test anonymous and authenticated `verify_sanad_public` calls for valid, malformed, revoked, and unknown tokens; assert that only the approved result columns are returned.
3. Query `pg_policies`, table privileges, bucket `public` flags and storage policies after migration. Test cross-tenant membership changes and storage read/write/update/delete using two test tenants.
4. Review historical storage object paths. Migration policies expect the first folder segment to be a tenant UUID; move/reconcile existing objects before rollout if that convention is not already in use.
5. Run repository lint, tests and build, then add real Supabase integration tests and Playwright coverage. These commands were not executable in this GitHub-only environment and no pass is claimed.
6. In GitHub repository settings, change visibility to **Private** if source should not be publicly browsable; first review organization access, forks, cached copies and any exposed secrets. Rotate any credentials ever committed. Do not treat source privacy as a replacement for application authorization.

## Remaining issues requiring manual configuration or further investigation

- Confirm RLS/grants/policies/functions/views and applied migration history in production; verify FORCE RLS effects with the actual role/function ownership model.
- Establish authoritative role matrix and row-level access scopes for teacher assignments, parents, students, finance and support impersonation.
- Add database-backed transactional admission/provisioning and fee/journal posting workflows with balanced immutable posted entries.
- Validate all cross-tenant foreign-key relationships and add safe composite constraints after data audit.
- Review Supabase Auth security settings, rate limits, recovery redirects, SMTP, MFA, secret rotation, Vercel environment configuration, security headers/CSP, logging and monitoring.
- Validate public admission anti-abuse controls and narrowly scope the anonymous insert surface.
- Audit and update all remaining public pages, metadata, dashboard actions, localization and responsive layouts, then test each required viewport and workflow in a browser.
