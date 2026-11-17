# Secure Manual Madrasa Admin Activation

## Purpose

This workflow lets the Global Platform Owner approve and activate a madrasa without relying on email delivery. It does not claim that the applicant's submitted email address has been verified.

## Login identity model

- The Owner verifies the applicant's identity through a selected out-of-band channel (phone call, WhatsApp, or in person) and records that attestation.
- The platform creates a random MDI Login ID in the reserved `accounts.sahitech.invalid` namespace. This address is a platform-issued login alias, not the applicant's real email address.
- Supabase Auth confirms only this platform-generated alias so email/password sign-in can work without SMTP. The applicant's submitted contact email remains separately stored on the tenant and `contact_email_verified = false`.
- The Owner shares the MDI Login ID and temporary password manually.
- Temporary passwords are generated with Node.js cryptographic randomness and exist only in the no-store provisioning/recovery response and transient Owner UI state. They are not written to SQL, audit logs, page props, or application logs.
- The Owner UI clears the credential display after five minutes. The Owner can issue a replacement credential through the audited recovery action after re-verifying the contact and providing a reason.

## Provisioning safeguards

- Both provisioning and recovery require the signed-in singleton Global Platform Owner, verified AAL2/MFA, and an explicit contact-verification attestation.
- The database transaction checks application status, verified documents, absence of pending document reviews, tenant identifier collisions, duplicate provisioning, and existing Auth accounts registered to the applicant's real email.
- The server creates the Auth identity with Supabase Auth Admin APIs. The database RPC never accepts or returns a password and never writes to `auth.users` or `auth.identities`.
- Existing Auth users are not silently taken over or password-reset by initial provisioning.
- Manual account creation is rate limited and recorded in the append-only platform audit log.
- A first-login flag is held in server-controlled Auth `app_metadata`. Middleware and tenant authorization helpers block normal access until the account changes its password.
- Manual recovery is restricted to MDI-created manual accounts, requires a 20–500 character reason and fresh out-of-band contact verification, and records requested/succeeded/failed outcomes.

## Operational setup

1. Configure `SUPABASE_SERVICE_ROLE_KEY` (or the newer `SUPABASE_SECRET_KEY`) as an encrypted server-only environment variable for the web app. Never prefix it with `NEXT_PUBLIC_`.
2. Deploy the application only after the migration and code have passed review and CI.
3. Before applying the migration, inspect the migration ledger in the target environment. This repository's migration `00045` was not present in either connected database ledger during the 2026-11-17 review.
4. Use the Global Owner Dashboard, choose Manual Admin Activation, select the contact-verification method, and affirm that the contact was verified.
5. Copy the MDI Login ID and temporary password to the verified representative. Do not send credentials to an unverified contact.
6. Ask the administrator to sign in and change the temporary password immediately.

## Recovery

If the Owner did not capture the one-time password or the administrator loses access, use Manual Admin Recovery only after verifying the same representative through a registered contact channel. Record the reason. The new temporary password must be changed at the next login.

This is an Owner-assisted recovery path, not self-service email recovery. When the actual contact email is verified in a future email integration, a separate email verification and password recovery flow can be enabled without changing the internal login identifier contract.

## Rollback

- Do not delete tenant, branch, academic-year, profile, membership, or Auth records as a rollback shortcut.
- If the release is blocked, roll back the web application to the previous deployment and leave the additive database columns/functions in place until a reviewed forward migration retires them.
- The legacy unsafe provisioning RPC is dropped by migration `00045`; do not recreate it.
- Any account created through the new workflow should be disabled or remediated through a reviewed operational procedure, not removed with cascading tenant data.
