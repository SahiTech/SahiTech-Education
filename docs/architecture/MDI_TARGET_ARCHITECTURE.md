# MDI Target Architecture and Implementation Decisions

**Status:** Accepted architecture baseline; implementation pending isolated development environment  
**Date:** 2026-11-13  
**Repository branch:** `feat/mdi-production-hardening`  
**Production changes:** Prohibited without separate explicit approval

## 1. Project identity

- Parent brand: SahiTech
- Education division: SahiTech Education
- Platform: Madrasa Digitalization Initiative (MDI)
- Production Supabase project: `xbswamfmslhliayoowlo`
- Global Platform Owner identity: `helpline.sahitech@gmail.com`

MDI is a multi-tenant SaaS platform. The Global Platform Owner is a platform-level principal and is not a tenant role. Madrasa Admin is an institution-scoped role.

## 2. Accepted architecture decisions

| Concern | Decision |
|---|---|
| Global Owner authentication | Email/password with mandatory MFA |
| Madrasa approval | Global Owner approval plus document verification |
| Invitation delivery | Email |
| Tenant activation | After onboarding and final Global Owner review |
| Existing super_admin role | Audit and safely migrate to separate owner model |
| Development environment | Separate Supabase project |
| Transactional email provider | Resend |

Email provider integration must use server-only credentials and environment variables. No Resend domain is currently configured in the connected account; sending remains disabled until a sender domain is verified and approved for use.

## 3. Non-negotiable invariants

1. Exactly one Global Platform Owner exists.
2. The owner identity is bound to a verified Supabase Auth user.
3. Ordinary users cannot create, replace, or promote a Global Owner.
4. Global Owner authorization never depends on tenant membership.
5. Tenant roles are limited to:
   - `madrasa_admin`
   - `academic_dean`
   - `teacher`
   - `accountant`
   - `hostel_warden`
   - `student`
   - `parent`
6. `super_admin` must not be used as a platform-level authorization role. Existing enum values and memberships require inventory and a reversible migration plan before removal.
7. Public applicants cannot directly create active tenants or tenant memberships.
8. Application approval, invitation acceptance, provisioning, onboarding, tenant activation, and verification are distinct lifecycle events.
9. All tenant-owned relationships must enforce tenant consistency at the database boundary wherever practical.
10. Production migrations, database writes, Auth changes, and deployment require explicit separate approval.

## 4. Target architecture

### Platform layer

- A restricted `private` schema contains platform-only authorization records.
- A singleton owner record binds one Auth user ID to the approved owner identity.
- Platform owner routes and Server Actions use server-side authorization.
- Platform actions create immutable audit events.
- No client-side metadata or user-editable profile field grants authority.

### Tenant layer

- Each Madrasa is an independent tenant.
- Tenant membership is represented by `tenant_users`.
- Tenant permissions are evaluated only within the selected tenant.
- Invalid tenant selection fails closed; it must not silently fall back to another membership.
- Cross-tenant references are prevented through composite tenant-aware foreign keys or equivalent database constraints.

## 5. Registration and approval lifecycle

1. Public applicant submits an institution application without authentication.
2. Server validates and normalizes input, applies rate limiting and duplicate detection, and validates uploaded documents.
3. Application remains pending; no tenant or privileged membership is created.
4. Global Owner reviews the application and supporting documents.
5. Only an approved application can issue an invitation.
6. A time-limited, single-use invitation is sent by email.
7. The nominated Muhtamim verifies their email and accepts the invitation.
8. Tenant provisioning runs as one recoverable database transaction.
9. The Muhtamim completes the existing six-step onboarding.
10. Global Owner performs final review and activates/verifies the tenant.

### State models

- Application: `pending`, `under_review`, `info_requested`, `approved`, `rejected`, `withdrawn`
- Invitation: `pending`, `sent`, `accepted`, `expired`, `revoked`
- Provisioning: `not_started`, `in_progress`, `completed`, `failed`, `retryable`
- Onboarding: `not_started`, `in_progress`, `completed`
- Tenant: `provisioning`, `pending_activation`, `active`, `suspended`, `closed`
- Verification: `unverified`, `pending_review`, `verified`, `rejected`, `revoked`

Every transition must validate the current state, actor authority, transition preconditions, and idempotency key, then emit an audit event.

## 6. Proposed database objects

Names are provisional until the development schema is reconciled.

- `private.platform_owner`: singleton owner binding.
- `public.madrasa_applications`: application record and review lifecycle.
- `public.madrasa_application_documents`: private document metadata.
- `public.platform_invitations`: invitation state, expiry, token hash, acceptance.
- `public.platform_audit_logs`: platform-level append-only privileged events.
- `public.email_outbox`: transactional email jobs and delivery state.

Invitation tokens must be generated using a cryptographically secure random generator. Store only a cryptographic hash of the token. Tokens are single-use, expire, and can be revoked. Do not use deterministic hashes of personal or institutional attributes as access tokens.

Tenant provisioning must be transactional and idempotent. Email sending must use an outbox pattern so that database state and delivery retries remain recoverable.

## 7. Security remediation priorities

### Critical

- Replace unrestricted `student_guardians` public INSERT with a validated admission workflow.
- Restrict public Sanad verification to a minimal response and remove unsafe direct-table fallbacks.
- Review the current public Sanad verification token design; use random tokens and stored hashes for future issuance.
- Restrict Storage uploads to authorized tenant paths and private documents; review current public bucket exposure.
- Replace broad table grants with a table-by-table least-privilege model.
- Enforce tenant consistency for relational references.
- Separate platform-owner authorization from tenant RBAC.
- Remove any ability for tenant users to assign platform-level privileges.

### High

- Review SECURITY DEFINER functions and execution grants individually.
- Preserve Auth trigger behavior while removing unnecessary direct RPC execution.
- Correct tenant-context fallback behavior to fail closed.
- Add transaction boundaries for provisioning, finance, admissions, hostel allocation, and onboarding.
- Make privileged audit writes reliable and append-only.
- Add database-level RLS integration tests.

### Performance

- Review all 53 unindexed foreign keys and prioritize high-traffic relationships.
- Review permissive policy combinations and query plans before changing policies.
- Resolve Auth RLS initialization-plan warnings.
- Review unused indexes using production-like query workloads before removal.

## 8. Migration strategy

The repository migration `00007_security_hardening` is not to be applied directly. It was not found in live migration history, and its current role assumptions conflict with the accepted owner/tenant separation.

Before writing migrations:
1. Reconcile every object in the source migration with live schema state.
2. Inspect current data and dependencies.
3. Design new additive, reversible migrations.
4. Test migrations against the isolated development project.
5. Run RLS, grant, function, Storage, and advisor checks.
6. Prepare rollback or forward-fix instructions.
7. Request separate approval before production execution.

Do not drop enum values, tables, policies, or data as part of an initial hardening pass.

## 9. Resend integration

- Use Resend for transactional email only.
- Implement a provider adapter and server-only sending module.
- Use environment variables for API key and verified sender address.
- Never expose credentials through `NEXT_PUBLIC_*` variables.
- Keep application state and email delivery decoupled with an outbox.
- Handle retries, bounces, suppressed recipients, and delivery failures.
- The connected Resend account currently has no sending domains configured. Domain verification and sender approval are prerequisites to live email delivery.

## 10. Development and release strategy

- Development must use a separate Supabase project, not the production project.
- Production project remains read-only during development.
- GitHub work is isolated on `feat/mdi-production-hardening`.
- Never push directly to `main`.
- Work is delivered through a Pull Request.
- Run unit, integration, database RLS, authorization, tenant isolation, file upload, email, and end-to-end tests.
- Deploy to staging only after development verification.
- Production deployment is a separate approval gate.

## 11. Current verified baseline

- Production project: PostgreSQL 17.11, region `ap-south-1`, ACTIVE_HEALTHY.
- 32 public tables; RLS enabled on all 32.
- 67 public policies.
- Zero tenants, Auth users, and tenant memberships at audit time.
- Six live migration entries through `00006_upgrade_sanad_cryptographic_verification`.
- No live `platform_owners` table.
- No Edge Functions found.
- Four public SECURITY DEFINER functions are executable by broad roles and require function-specific review.
- `student_guardians` contains a public INSERT policy with `WITH CHECK (true)`.
- Current Storage policies allow broad authenticated uploads; bucket visibility requires remediation.
- 74 foreign keys, including 53 without a leading child-side index.
- Existing code contains login and a six-step onboarding wizard, but no complete public application/approval/invitation workflow.
- Current provisioning immediately creates an active tenant for an authenticated caller.
- Onboarding currently sets tenant verification automatically.

These findings are an initial reconciliation baseline and must be revalidated against the development schema and latest source before each implementation step.

## 12. Implementation phases

0. Reconcile repository, production schema, grants, policies, Storage, Auth, and migration drift.
1. Finalize threat model, role matrix, state transitions, and database contracts.
2. Create isolated development Supabase project and configure non-production secrets.
3. Implement singleton Global Owner authorization and MFA enforcement.
4. Implement public Madrasa application and document submission.
5. Implement Global Owner review and approval dashboard.
6. Implement secure Resend invitation delivery and account acceptance.
7. Implement atomic tenant provisioning and idempotent recovery.
8. Redesign onboarding and final activation lifecycle.
9. Harden tenant RBAC, RLS, grants, functions, Storage, and relational integrity.
10. Run security, integration, performance, and end-to-end tests.
11. Deploy to staging, verify, and open Pull Request.
12. Production release only after explicit approval.

## 13. Acceptance criteria

- Only the designated Global Owner can access platform administration.
- Exactly one owner exists and cannot be replaced by tenant users.
- Madrasa Admin cannot access another tenant.
- Public application submission creates no tenant or membership.
- Only approved applications can receive invitations.
- Invitations are random, hashed at rest, single-use, expiring, and revocable.
- Failed provisioning leaves no partial tenant state.
- Onboarding cannot bypass final approval.
- Tenant data and Storage objects are isolated.
- Public admission and guardian submission are validated.
- Privileged actions are reliably audited.
- Database integration tests demonstrate tenant isolation.
- No unresolved critical security findings remain at release.
- Production changes occur only after explicit approval.
