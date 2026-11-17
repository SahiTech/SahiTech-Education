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
- The administrator must set a new password of at least 12 characters. A successful change is recorded in the private password-change event table and the platform audit trail before normal tenant access is restored.

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

## Migration order and safety

- For a fresh environment, apply `00046` first (it creates the reservation tables), then `00045` (transitional verification columns and AAL2-guarded compatibility RPCs), then `00047` (it removes the transitional RPCs and tightens recovery), followed by `00048` and `00049`. The Development ledger was verified in that actual order: `00046`, `00045`, `00047`, `00048`, `00049`.
- Migration `00046` establishes reservation-based provisioning and the database-backed password-change gate; `00045` adds the transitional contact-verification fields and AAL2-guarded compatibility RPCs; `00047` records the attestation on reservation records, flags manual tenants, and drops the transitional RPCs while restricting recovery to manual accounts; `00048` adds the Owner-bound, atomic single-use credential handoff nonce; `00049` hardens all five active Owner provisioning/recovery RPCs with a database-level AAL2 check.
- Inspect each target environment's migration ledger before applying. Do not rewrite an already-applied migration.
- Do not apply this change to Production until the Development workflow has passed database smoke checks and real Supabase Auth create/login/password-change/recovery tests.

## Rollback

- Do not delete tenant, branch, academic-year, profile, membership, or Auth records as a rollback shortcut.
- If release is blocked, roll back the web application to the previous deployment and leave additive database objects in place until a reviewed forward migration retires them.
- Do not recreate the old direct password provisioning RPC or any static-password fallback.
- Any partially created Auth identity must be investigated and disabled through a reviewed operational procedure, not removed with cascading tenant data.
