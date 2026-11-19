# Secure Manual Madrasa Admin Activation

## Purpose

This workflow lets the Global Platform Owner approve and activate a madrasa without relying on email delivery. It does not claim that the applicant's submitted email address has been verified.

## Login identity model

- The Owner reviews the application documents and directly contacts the responsible representative through a phone call, WhatsApp, in-person verification, or signed authorization.
- Before provisioning, the Owner records the verification method, a 20–500 character verification note, and an explicit confirmation in the MFA-protected Owner dashboard.
- The platform creates a random MDI Login ID in the reserved `login.sahitech.invalid` namespace. This is a platform-issued sign-in alias, not the applicant's real email address.
- Supabase Auth confirms only this platform-generated alias so email/password sign-in works without SMTP. The applicant's submitted contact email remains separately stored on the tenant and `contact_email_verified = false`.
- The Owner manually delivers the MDI Login ID and temporary password by WhatsApp, SMS, or another verified channel.

## Provisioning controls

- Provisioning starts with a database reservation bound to the Global Owner and application. The reservation expires after 15 minutes, prevents concurrent duplicate setup, and limits repeated attempts.
- The server creates the Auth identity only through the server-only Supabase Auth Admin API. It then finalizes the reservation into the tenant, branch, academic year, departments, and initial administrator membership in one database transaction.
- If Auth creation or tenant finalization fails, the server records the failed attempt and attempts to delete the unassigned Auth identity; if deletion fails, the identity is banned. Credentials are never included in SQL RPC results.
- The server generates temporary passwords using Node.js cryptographic randomness. The credential payload is encrypted with AES-256-GCM and placed in a 90-second, Secure, HttpOnly, SameSite=Strict host cookie. The database stores only a SHA-256 nonce hash, Owner binding, expiry, and consumed timestamp.
- The Owner opens a dedicated no-store HTML endpoint. It verifies the Owner's AAL2 session and atomically consumes the nonce before displaying the credentials. A second request, another Owner session, or an expired cookie cannot retrieve the same credential. Plaintext credentials are not returned in JSON, Server Action results, or page props and are never written to SQL or logs.
- The MDI login alias is non-routable. It cannot receive mail and is not the institution's contact email.

## First login

- Manual accounts carry a server-controlled Auth `app_metadata` marker.
- Middleware, server-side tenant context, and database-backed tenant-feature checks enforce the first-login password-change gate. The database RPC reads current Auth metadata so a stale access token cannot bypass an Owner-assisted password reset.
- The first-login form requires the Owner-issued temporary password, a new password, and confirmation of the new password. The server passes the temporary password as Supabase Auth `current_password` and the new password as `password`; this preserves the project's current-password verification policy.
- The new password must be at least 12 characters and include uppercase, lowercase, and numeric characters. The new password must differ from the temporary password.
- A successful change is recorded in Auth app metadata, the private password-change event table, and the platform audit trail before normal tenant access is restored. Password values are never logged.

## Owner-assisted recovery

- Recovery is offered only for tenants flagged as manually provisioned and only for the exact Auth user recorded by a completed manual provisioning reservation.
- Existing invitation-based accounts and unrelated administrators cannot be reset through this workflow.
- The Owner must re-verify the account holder through a phone call, in-person check, or signed authorization, and record a 20–500 character reason.
- Recovery is rate limited and records requested, completed, or failed outcomes. It produces a new one-time temporary password and forces the first-login password-change gate again.
- This is not self-service email recovery. Once an actual contact email is independently verified through a future email integration, a separate email-based recovery path can be added without replacing the MDI login identity contract.

## Invitation and application upload tokens

- Self-service invitation and application upload token creation fail closed unless `MDI_EMAIL_TOKEN_HMAC_SECRET` is configured with at least 32 bytes of entropy.
- There is no hardcoded HMAC fallback and no derivation from the public anon key.
- Manual activation does not depend on SMTP or the invitation HMAC secret. However, the public application submission/upload-token flow still requires `MDI_EMAIL_TOKEN_HMAC_SECRET` even when no email is sent; configure this server-only signing key so application intake and document upload remain available.

## Server configuration

1. Configure `SUPABASE_SECRET_KEY` as an encrypted server-only environment variable for the web app. The legacy `SUPABASE_SERVICE_ROLE_KEY` remains a fallback during the API-key transition. Never prefix either key with `NEXT_PUBLIC_`.
2. Keep the ordinary user-session Supabase client separate from the Auth Admin client.
3. Configure `MDI_CREDENTIAL_DISPLAY_KEY` as a server-only base64-encoded 32-byte key for AES-256-GCM credential handoff. Generate with `openssl rand -base64 32`.
4. Configure `MDI_EMAIL_TOKEN_HMAC_SECRET` as a server-only high-entropy key for public application upload-capability token signing. Manual activation itself does not depend on SMTP, but public application intake/upload does.
5. Before release, verify that the connected Supabase Auth configuration accepts the generated `.invalid` sign-in alias and that the application allows password sign-in for this identity.

## Emergency Production mitigation — 2026-11-17

The Production audit found the legacy `public.owner_direct_setup_madrasa_admin(UUID,TEXT,BOOLEAN)` function still exposed to `anon` and capable of using a hardcoded fallback password, directly writing to `auth.users`/`auth.identities`, and returning a `password_used` field. This was a critical legacy vulnerability.

- Emergency migration `00051_emergency_retire_legacy_direct_admin_setup.sql` has been applied to both Production and Development.
- A read-only SQL verification confirmed the legacy function no longer exists in Production.
- Production initially contained baseline 00044 plus emergency 00051. On 2026-11-17, migration 00052 was also applied as an independent security hotfix: read-only SQL verification confirmed public.owner_direct_provision_tenant(UUID,UUID) is absent and the four existing lifecycle Owner RPCs require AAL2 at the database boundary.
- Production now has 00044, emergency 00051 and security hotfix 00052. Feature migrations 00045–00050 remain pending. Migration 00052 is independent of the manual-admin reservation tables/functions and was verified against the existing Production lifecycle RPC signatures before application.
- The old Production Owner UI still references the retired RPC until the secure application release is deployed. Direct manual provisioning through that old UI is therefore intentionally unavailable rather than falling back to the insecure routine.
- Do not recreate or re-grant the legacy function. Complete the secure release sequence below before restoring manual admin provisioning.

## Migration order and safety

- For a fresh environment, apply 00046 first (reservation tables), then 00045 (transitional verification columns and compatibility RPC), then 00047 (removes transitional RPCs and tightens recovery), followed by 00048, 00049, 00050, 00051 and 00052. Development has these migrations applied; its ledger currently contains two same-name entries for 00052 from a repeated idempotent application, so reconcile the ledger before a future db push and do not manually delete migration-history rows.
- Production already has emergency migration 00051 and independent security hotfix 00052 recorded after 00044. Do not reapply either. After the remaining Production release gates pass, apply only the pending feature sequence 00046, 00045, 00047, 00048, 00049 and 00050. Inspect the actual Supabase migration ledger and migration plan immediately before execution.
- Migration `00046` establishes reservation-based provisioning and the database-backed password-change gate; `00045` adds transitional contact-verification fields; `00047` records verification attestations, flags manual tenants, drops transitional RPCs and restricts recovery; `00048` adds Owner-bound single-use credential handoff; `00049` verifies database AAL2 on the five active manual-admin RPCs; `00050` adds credential-handoff rate limiting and its audit-window index; `00051` retires the insecure legacy direct-admin setup RPC; `00052` drops the unused legacy direct-tenant provisioning RPC and adds database AAL2 checks to invitation issuance, document review, application status changes and final tenant activation.
- Inspect each target environment's migration ledger before applying. Do not rewrite an already-applied migration.
- Development migration and targeted Owner-RPC SQL smoke checks passed on 2026-11-17. Real Supabase Auth create/login/forced-password-change/recovery E2E remains NOT VERIFIED. Production rollout remains blocked until the server-only Auth Admin key and HMAC secret are configured, real Auth E2E is completed, Preview build/runtime is validated, Security Advisor/backup readiness is reviewed, and the release migration plan is rehearsed.

## Rollback

- Do not delete tenant, branch, academic-year, profile, membership, or Auth records as a rollback shortcut.
- If release is blocked, roll back the web application to the previous deployment and leave additive database objects in place until a reviewed forward migration retires them.
- Do not recreate the old direct password provisioning RPC or any static-password fallback.
- Any partially created Auth identity must be investigated and disabled through a reviewed operational procedure, not removed with cascading tenant data.
