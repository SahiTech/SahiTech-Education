# MDI Development Implementation Log

**Environment:** Supabase project `sahitech-mdi-dev`  
**Project ref:** `srcmodeinjvfqwkramni`  
**Repository branch:** `feat/mdi-production-hardening`  
**Production impact:** None. Production project remains unchanged and read-only.

## Development baseline

The clean development project was initialized with repository migrations `00001` through `00006`. The existing repository migration `00007_security_hardening.sql` was deliberately not applied because its legacy `super_admin` authorization assumptions conflict with the accepted separation of platform owner and tenant roles.

## New development migrations

| Migration | Purpose |
|---|---|
| `00008_platform_owner_and_applications` | Restricted singleton owner record, AAL2-aware owner predicate, public Madrasa application lifecycle tables, private document metadata, invitation table, email outbox |
| `00009_public_privacy_and_guardian_policy` | Removes unrestricted public guardian inserts; revokes direct client execution of the Auth trigger; minimizes public Sanad verification response |
| `00010_platform_workflow_grants` | Explicit least-privilege table grants for application, invitation, document metadata, owner and outbox tables |
| `00011_verified_owner_binding` | Binds the designated owner only after Supabase Auth confirms the exact owner email; exposes an authenticated boolean owner predicate |

## Application changes

- Tenant context now fails closed when the selected tenant is invalid.
- If a user has multiple tenant memberships and no explicit tenant is selected, context resolution returns no tenant instead of choosing the first membership.
- Public Sanad verification validates the token format, uses only the sanitized RPC and fails closed if the RPC errors.
- The public verification page no longer renders student identity or the raw verification token.

## Verification performed

- Development project status: `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- Migrations `00001`–`00006` and `00008`–`00011` are recorded in development migration history.
- All 36 public tables have RLS enabled.
- The legacy unrestricted `student_guardians` public INSERT policy is absent.
- Anonymous users cannot select application records or read/write application-document metadata.
- The email outbox is inaccessible to anon and authenticated roles.
- The Auth profile trigger function is not directly executable by anon.
- The singleton owner seed exists and remains unbound until the designated email is verified.
- The database smoke assertions in `packages/database/tests/platform_security_smoke.sql` were executed successfully against development.

## Known limitations / next steps

- The Global Owner Auth account has not yet been created or verified. Owner binding therefore remains pending.
- MFA enrollment/challenge UI and a protected Global Owner review dashboard remain to be implemented.
- Public application submission UI, abuse/rate limiting, private document upload flow, invitation acceptance, and atomic tenant provisioning remain pending.
- Resend sending remains disabled until a verified sender domain is configured.
- Full pnpm unit tests, TypeScript, lint, build and browser E2E checks have not yet been run in a repository checkout. Do not treat the database smoke checks as a substitute.
- Security advisor still reports the three legacy tenant/Sanad SECURITY DEFINER RPCs as callable by anon/authenticated. The tenant helper functions are used by existing RLS policies; Sanad verification is intentionally public but returns a minimized response. Each function needs an individual review before any ACL change.
- Existing 53+ missing FK indexes and permissive-policy advisor findings are deferred for workload-aware review.
- Production migrations, Auth changes and deployment require separate explicit approval.
