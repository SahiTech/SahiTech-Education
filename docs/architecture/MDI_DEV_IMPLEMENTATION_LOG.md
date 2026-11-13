# MDI Development Implementation Log

**Environment:** Supabase project `sahitech-mdi-dev`  
**Project ref:** `srcmodeinjvfqwkramni`  
**Repository branch:** `feat/mdi-production-hardening`  
**Pull request:** [#1 — MDI platform owner and tenant security](https://github.com/SahiTech/SahiTech-Education/pull/1)  
**Production impact:** None. Production project remains unchanged and read-only.

## Architecture baseline

The accepted architecture is recorded in `MDI_TARGET_ARCHITECTURE.md`. It defines one isolated Global Platform Owner, tenant-scoped roles, mandatory owner MFA, owner-reviewed Madrasa applications, verified-email invitations, atomic tenant provisioning, onboarding, and a separate final activation decision.

## Development database migrations

Development has migrations `00001`–`00006` and `00008`–`00030` applied. Repository migration `00007_security_hardening.sql` was deliberately not applied because its legacy `super_admin` assumptions conflict with the accepted platform-owner separation.

| Migration range | Implemented foundation |
|---|---|
| `00008`–`00011` | Restricted singleton owner record, AAL2-aware authorization, verified owner binding, public application base schema, invitation and email outbox tables, least-privilege grants |
| `00012`–`00014` | Verified-email invitation acceptance, atomic initial tenant provisioning, pending-activation lifecycle, final owner activation, owner review access |
| `00015`–`00017` | Private document bucket, expiring upload capability hashes, validated application submission RPC, document metadata registration, direct-table submission disabled, final activation constraints |
| `00018`–`00023` | Resend outbox claim/completion RPCs, lease recovery, retry backoff, atomic application review/rejection, invitation revocation and replacement |

## Application changes

- `/register-madrasa` now submits a public application. It does not create a tenant or grant a role.
- Application submission uses a validated RPC, per-email daily limit, strict field validation, and a private upload capability.
- Applicants can upload supporting documents to a private Storage bucket. Accepted types are PDF/JPEG/PNG, maximum 10 MB each, up to 10 registered uploads.
- `/platform/login` provides dedicated Global Owner email/password authentication and TOTP enrollment/challenge.
- `/platform` provides an AAL2-protected review dashboard, private document preview links, invitation issue/reissue, and final tenant activation.
- Invitation acceptance supports new account creation and existing-account sign-in. Supabase email confirmation returns through `/auth/callback`.
- Invitation acceptance requires a verified Auth email matching the invitation and provisions the tenant, Main Campus, academic year, default departments, and `madrasa_admin` membership in one database transaction.
- Newly provisioned tenants remain `pending_activation` and `is_active=false`. The tenant admin can complete onboarding, but activation and verification are deferred to a separate Global Owner action.
- Legacy direct tenant provisioning has been disabled.
- Legacy `super_admin` is no longer a tenant application role. New/updated memberships using that enum value are rejected, RLS helper functions exclude it, and the application RBAC type/permission map no longer grants it permissions. The database enum value is retained temporarily for compatibility; production membership audit is required before a later enum cleanup.
- Database trigger guards prevent tenant administrators from setting platform lifecycle state to active/verified or rebinding the source application.
- Platform lifecycle events are recorded in an append-only audit table, readable only by the AAL2 Global Platform Owner. The Owner dashboard now displays recent audit events. Tenant admins can only submit the tenant into pending activation after onboarding.
- Tenant context fails closed on invalid or ambiguous tenant selection.
- Public Sanad verification fails closed, no longer falls back to direct table access, and omits student identity and the raw verification token.
- Password recovery and reset routes are now present.

## Email delivery

- Invitation creation queues an outbox event. It does not claim the message was delivered.
- The Edge Function `supabase/functions/process-email-outbox` is implemented with a cron-secret gate, Resend API integration, URL-origin validation, idempotency key, retry backoff and worker leases.
- The worker is **not deployed or scheduled**. Resend currently has no verified sender domain configured, so live invitation email delivery remains disabled.
- Setup steps and required environment secrets are documented in `docs/operations/RESEND_OUTBOX_SETUP.md`. Secrets must be configured directly in Supabase/Resend, never committed or pasted into chat.

## Verification completed

- Development project is `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- Migrations `00001`–`00006` and `00008`–`00020` are present in development migration history.
- All 37 public tables have RLS enabled.
- The unrestricted public `student_guardians` INSERT policy is absent.
- Direct anonymous INSERT on `madrasa_applications` is revoked; the validated submission RPC remains callable.
- Anonymous users cannot read application records or document metadata.
- The email outbox is inaccessible to anon and authenticated roles.
- Anonymous table grants were reduced to SELECT plus one INSERT grant for the existing public student-admission workflow; anon UPDATE/DELETE and all TRUNCATE/REFERENCES/TRIGGER grants were removed.
- 37 tenant-aware composite foreign keys are validated. Cross-tenant class/section references are rejected by the database.
- Journal entry lines now derive `tenant_id` from the parent journal and enforce a same-tenant account reference; a finance cross-tenant insertion test was rejected and rolled back.
- Tenant mutation policies now target authenticated sessions only. Multiple-permissive-policy advisor findings reduced from 150 to 34.
- `madrasa-assets` remains public-read with tenant-admin uploads restricted to a tenant UUID folder and only JPEG/PNG/WebP accepted (SVG excluded). `sanad-documents` and `student-documents` are private; broad authenticated upload policy was removed. All three buckets had zero existing objects when changed.
- Application upload capability validation and document bucket/policy presence were checked.
- A smoke application and its upload capability were created and deleted inside a test block; no smoke rows remain.
- The SQL assertions in `packages/database/tests/platform_security_smoke.sql` were executed successfully against development, including tenant lifecycle and legacy-role guard checks. A transactional application submission test also confirmed the audit trigger writes the corresponding platform audit event.
- GitHub Actions run **MDI CI #38** completed successfully: dependency installation, domain/database tests, TypeScript check, web lint and Next.js production build all passed.
- No production database migration, Auth change, deployment or merge was performed.

## Remaining before release

1. Create/verify the designated Global Owner Auth account and complete its TOTP enrollment. The singleton owner record remains unbound until this is done.
2. Verify the real application submission, file upload, owner review, email delivery, invitation acceptance and onboarding flows end-to-end in a browser with real test accounts.
3. Configure and verify the Resend sender domain, set Edge Function secrets, deploy the outbox worker, and schedule authenticated invocations.
4. Review remaining legacy SECURITY DEFINER warnings function by function. Current warnings include legacy tenant helper RPCs used by RLS, public Sanad verification, and intentionally restricted platform workflow functions.
5. Review remaining performance advisor findings: 56 unindexed foreign keys, 2 Auth RLS initplan warnings, 3 unused-index warnings, and 34 multiple-permissive-policy findings. These are not automatically vulnerabilities and require workload-aware review.
6. Add full RLS cross-tenant integration tests and browser E2E tests for invitation and activation lifecycles.
7. Keep the PR draft until real Auth/MFA and browser integration checks are completed.

Production changes, deployment, merge, and enabling live email require separate explicit approval.
