# MDI Manual Madrasa Admin Activation Runbook

## Purpose

This workflow allows the Global Platform Owner to approve and provision a madrasa administrator without depending on SMTP, Resend, email invitations, or an external SMS provider.

The Global Platform Owner retains the approval and activation decision. The administrator receives a one-time temporary password through a manually verified channel such as an in-person handover, a confirmed phone conversation, or an approved WhatsApp/SMS contact.

## Login identity and contact email are different

New manually provisioned accounts receive an internal login identifier:

`mdi-<random-128-bit-id>@login.sahitech.invalid`

The `.invalid` domain is intentionally non-routable. It is a technical Supabase Auth login identifier, not an inbox and not the madrasa's contact email. The real application contact email remains in the application/tenant business record and is not marked as verified by manual activation.

The temporary password and login identifier are shown to the authenticated Global Platform Owner only after the server has successfully provisioned the tenant. The password is not stored in application tables, logs, or page props. The Owner must manually deliver it and must not reuse or retain it.

## Required server configuration

Configure `SUPABASE_SERVICE_ROLE_KEY` in trusted server environments only (for example, Vercel Production/Preview as appropriate). This key is required for the server-side Supabase Auth Admin API used by manual provisioning and owner-assisted password reset.

- Never prefix it with `NEXT_PUBLIC_`.
- Never import the Admin client into Client Components.
- Never share the key through chat, tickets, source control, screenshots, or browser code.
- If this variable is missing, manual provisioning and manual reset fail closed with a generic error.

`MDI_EMAIL_TOKEN_HMAC_SECRET` is separate. It is required only for secure self-service invitation and upload token derivation. Missing or weak configuration disables invitation-token issuing; it does not disable manual activation.

## Owner provisioning procedure

1. Sign in to Global Owner Console and complete MFA (AAL2).
2. Open the madrasa application and verify the application details and supporting documents.
3. Ensure at least one supporting document is marked Verified and no document remains Pending.
4. Confirm requested madrasa code and subdomain are available.
5. Open **Email ছাড়া Admin Account তৈরি করুন**.
6. Choose immediate activation only when institution readiness has been reviewed. Otherwise leave the institution in Pending Activation so its administrator can complete onboarding.
7. Submit the operation once. The server reserves the application for a short period, creates a dedicated Auth user via Supabase Auth Admin API, then atomically provisions the tenant, main branch, admin membership, academic year, and curriculum-specific starter departments.
8. The Owner receives the Login ID and temporary password once. Copy the handover message and deliver it through a channel whose recipient identity has been independently verified.
9. Close the credential panel after delivery. It is intentionally not recoverable from the dashboard; do not screenshot, store, or forward the credential elsewhere.

A completed application cannot be provisioned a second time. A failed reservation expires and is subject to an attempt limit; inspect the Owner audit trail before retrying.

## First login

The administrator signs in using the MDI Login ID and temporary password at the normal login page. The Middleware, server-side tenant context, and database tenant-access helper functions all enforce the mandatory password-change state.

The administrator is redirected to `/first-login-password` and cannot use tenant functionality until a new password of at least 12 characters is set and the password-change event is recorded. The server then refreshes the session and clears the force-change flag through the Auth Admin API.

## Owner-assisted password recovery

The email recovery screen remains available for users with a real, verified email login. A synthetic `.invalid` MDI Login ID cannot receive a recovery email.

Before an Owner resets an existing madrasa admin password:

1. Independently verify the person using the registered phone, in-person identity verification, or signed authorization.
2. Record the method and a meaningful verification note in the Owner console.
3. Submit the reset only after checking the application/tenant identity.
4. Deliver the newly issued temporary password only through the verified channel.
5. The administrator must complete the same first-login password-change flow.

The database allows no more than three manual reset requests per user in a rolling 24-hour period. Passwords are not persisted. The existing email confirmation state is not changed by a manual reset.

## Security controls

- Global Owner actions require a valid authenticated session, AAL2/MFA, and the singleton Owner authorization check.
- The temporary password is generated with Node.js cryptographic randomness (32 random bytes), server-side only.
- Login identifiers use 128 bits of cryptographic randomness.
- Provisioning reservations expire after 15 minutes and are bound to the requesting Owner.
- Provisioning is application-idempotent; tenant source application identity is unique.
- Supporting-document checks are made before reservation and again at finalization.
- SQL functions never receive or return a password.
- SQL writes only provisioning metadata and audit records.
- No raw credential is persisted in PostgreSQL.
- Auth user creation/password updates use server-only Supabase Auth Admin APIs; no custom SQL writes are made to `auth.users` or `auth.identities`.
- The synthetic login identifier is confirmed only as a system-generated technical Auth login. It must never be interpreted as proof of ownership of the real application contact email.
- First-password-change enforcement exists in Next.js Middleware, server-side tenant context, and PostgreSQL RLS helper functions.
- Existing users are not silently overwritten. Owner reset requires an explicit verification method and note, and it is audited and rate-limited.

## Migration and deployment sequence

Migration `00046_secure_manual_madrasa_admin_activation.sql` is forward-only. It drops the unsafe legacy direct-provisioning RPC, adds private workflow and audit state, and updates the tenant RLS helper functions to enforce first-login password change.

Before production rollout:

1. Confirm development and production migration ledgers separately.
2. Apply migration 00046 to an isolated development database first.
3. Run `packages/database/tests/manual_admin_activation_security.sql` in that development database.
4. Configure the server-only service role key in a protected preview/dev environment.
5. Test new-account provisioning, login with the synthetic ID, forced password change, tenant access, failure cleanup, reset, and audit trail.
6. Run CI, review the resulting diff, and document rollback/restore steps.
7. Obtain explicit approval before applying the migration to production or promoting application code.

Do not edit migration 00045 after it has been applied anywhere. Migration 00046 is the forward-only replacement.

## Rollback and incident response

Do not delete tenant, profile, Auth, audit, or application rows as a routine rollback. Do not restore the legacy password-returning SQL RPC.

If the release must be halted:
- Stop new manual provisioning by removing/withholding the server-side `SUPABASE_SERVICE_ROLE_KEY` from the affected deployment (this also disables owner-assisted password reset).
- Roll back the application deployment to the last reviewed version only after confirming schema compatibility.
- Keep migration 00046 in place; it is additive plus a deliberate removal of the unsafe RPC. A schema rollback that reintroduces direct Auth table writes or password-returning RPCs is prohibited.
- Reconcile any incomplete reservations from the private provisioning table and Auth audit evidence before a retry.
- Preserve append-only audit logs and existing tenants/accounts.

## Known operational dependency

Manual activation is independent of email but it is not independent of server-side Auth Admin privileges. Until `SUPABASE_SERVICE_ROLE_KEY` is securely configured in the server runtime, the feature remains unavailable by design. Do not weaken the security model to bypass this dependency.
