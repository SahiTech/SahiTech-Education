# 10. Authentication & Authorization

## 1. Identity layers

MDI has two distinct authorization domains:

1. **Platform identity:** the singleton Global Platform Owner authorization boundary. It is not a tenant membership or a tenant role.
2. **Institution identity:** authenticated users with active tenant-scoped memberships and roles in `tenant_users`.

An authenticated session alone does not grant platform or tenant access.
For institution workspaces, the sign-in action clears any prior `m_active_tenant` selection, reads the authenticated user's own active `tenant_users` memberships, and stores the sole membership ID in a Secure (Production), HttpOnly, SameSite=Lax cookie. Accounts with multiple active memberships must select an institution through `/select-tenant`; the selection action revalidates the submitted tenant against the authenticated user's active membership and tenant lifecycle. The cookie is a selector, never an authorization grant. Tenant context, server permissions and PostgreSQL RLS continue to validate access. Arbitrary request host labels must not be used to infer the tenant.

The shared Madrasa workspace navigation exposes Logout on desktop and mobile. The sign-out Server Action ends the Supabase session, deletes `m_active_tenant`, revalidates the application layout and redirects to `/login`. The restricted Global Platform Owner shell remains separate and retains its own logout control.

## 2. Authentication

Supabase Auth is the current authentication provider in the application source. The web app uses `@supabase/ssr` server/client utilities and cookie-backed sessions. Protected routes and server actions must obtain and validate the authoritative user on the server.

Do not rely on:
- client-side role state;
- user-editable metadata;
- caller-provided tenant IDs;
- a hidden/disabled navigation link;
- middleware alone as authorization.

Password reset, email confirmation, OTP and MFA behavior must be tested against the actual Supabase Auth configuration and redirect allowlists. Provider configuration cannot be inferred from source code.

## 3. Tenant role set

The intended institution-scoped roles are:

| Role key | Scope |
|---|---|
| `madrasa_admin` | Institution-level administration within authorized tenant |
| `academic_dean` | Academic administration within authorized tenant |
| `teacher` | Assigned teaching and classroom workflows |
| `accountant` | Approved fee and accounting workflows |
| `hostel_warden` | Approved boarding/hostel workflows |
| `student` | Own permitted student records |
| `parent` | Linked child/ward records only |

Actual permission scope must be enforced on the server and database. A role label alone does not express class assignment, student ownership, guardian relationship or least-privilege field visibility.

The legacy database enum value `super_admin` may remain during compatibility cleanup. It must not be used as a current tenant role or as the Global Platform Owner authorization mechanism.

## 4. Global Platform Owner boundary

The platform owner identity is held separately from tenant membership and requires the trusted owner binding plus mandatory MFA/AAL2 checks in the accepted platform workflow. Every owner page and server action must re-check authorization. Browser metadata or email equality alone must never grant owner access.

Owner lifecycle, invitation issuance, application review and final tenant activation are high-impact operations. Their database RPCs must independently enforce the bound Global Owner identity and AAL2; HTTP/server-action checks alone are not a database authorization boundary. The reviewed lifecycle RPCs are hardened by migration `00052`, while the five manual-admin provisioning/recovery RPCs are guarded by migrations `00046`–`00050`.

## 5. Authorization enforcement checklist

For every protected operation:
1. Validate the user session on the server.
2. Resolve the correct tenant and active membership.
3. Check a specific permission, not merely “is logged in”.
4. Validate all identifiers belong to the selected tenant.
5. Validate input with a runtime schema.
6. Execute through the intended database role/client.
7. Rely on RLS, grants and constraints as defense in depth.
8. Log sensitive lifecycle, finance and academic changes.
9. Return minimal errors and avoid leaking existence of protected records.

## 6. Secrets and credential lifecycle

Never hard-code initial passwords, return passwords from privileged RPCs, log reset tokens, or store raw invitation tokens where hashes can be used. Initial account activation should use verified invitations or a secure reset/onboarding flow. Secrets belong in server-only environment/secret stores.

Email-independent Madrasa Admin activation is implemented as a separate Owner-approved workflow documented in [Secure Manual Madrasa Admin Activation](30_SECURE_MANUAL_ADMIN_ACTIVATION.md). It requires Global Platform Owner AAL2 at both the HTTP and database RPC boundaries, explicit out-of-band identity verification, a server-only Supabase Auth Admin API call, and a platform-generated non-routable Login ID. The applicant's contact email remains unverified.

Temporary credentials are generated server-side, encrypted with AES-256-GCM in a 90-second HttpOnly cookie, and shown only after the MFA-verified Owner atomically consumes a one-time database nonce. Plaintext passwords are never returned by RPCs/JSON or persisted in database tables/logs. The first-login password-change gate is enforced at middleware, server context and database-policy levels.

Migrations 00046, 00045, 00047, 00048, 00049, 00050, 00051 and 00052 form the reviewed Development sequence. Production has emergency 00051 and independent security hotfix 00052; 00052 removes the unused legacy owner_direct_provision_tenant RPC and hardens four existing lifecycle Owner RPCs. Production feature migrations 00045–00050 remain pending. Inspect the actual target ledger and follow the dependency order in the runbook before any Production rollout. The transitional compatibility RPCs created in `00045` are dropped by `00047`. Never restore the retired direct-password or direct-tenant provisioning routines.

## 7. Verification expectations

Test:
- tenant admin cannot grant platform owner privileges;
- owner is rejected without trusted binding and required MFA;
- non-owner is rejected from owner routes and RPCs;
- tenant A cannot access tenant B, including guessed identifiers;
- inactive membership and pending/suspended tenants fail closed;
- teacher, parent, student and accountant see only their authorized records and fields;
- tokens/invitations expire, revoke and cannot be replayed;
- owner and tenant lifecycle actions are auditable.

## 8. Student and guardian login — current implementation boundary

The `student` and `parent` role keys describe intended institution roles, not proof that self-service student or guardian login is live. The current student record contains an optional `user_id` association, but the reviewed application has no complete verified account-provisioning and login journey for students or guardians. Public admission submission creates an admission application; it does not create an Auth identity.

A future student/guardian account workflow must be explicitly designed and tested before release:
- provision or invite an account only after the student's admission identity is verified by the institution;
- require verified contact ownership (for example, a supported OTP/email verification flow) before enabling recovery;
- link the Auth identity to the exact student record and active tenant membership server-side;
- limit a student to their own permitted records;
- link a parent/guardian account only through a verified `student_guardians` relationship and constrain access to the linked ward(s);
- never treat a public admission number, unverified phone number, tenant ID or caller-supplied student ID as authentication.


## Teacher identity binding

A teacher role is usable for classroom access only when an active `teachers` record is linked to an existing Auth user with a confirmed email matching the teacher record. The Madrasa Admin-only `admin_link_teacher_account` RPC performs the profile and tenant-membership link atomically. The workflow does not create passwords or silently invite unverified identities. Assignment-level access is enforced separately by RLS; see [Teacher Assignment Access Control](31_TEACHER_ASSIGNMENT_ACCESS_CONTROL.md). Guardian identity linking and invitation acceptance remain unimplemented.
