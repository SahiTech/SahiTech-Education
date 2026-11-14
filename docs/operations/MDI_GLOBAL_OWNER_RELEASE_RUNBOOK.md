# MDI Global Platform Owner & Release Operations Runbook

**Status:** Draft — development implementation; Production release NOT READY  
**Owner identity:** `helpline.sahitech@gmail.com`  
**Development project:** `sahitech-mdi-dev` (`srcmodeinjvfqwkramni`)  
**Production project:** `sahitech-mdi` (`xbswamfmslhliayoowlo`)  
**Feature branch:** `feat/global-owner-login-hardening`  
**Pull request:** https://github.com/SahiTech/SahiTech-Education/pull/4

## 1. Security boundaries

- The Global Platform Owner is a singleton platform identity, not a tenant role.
- Tenant roles are limited to `madrasa_admin`, `academic_dean`, `teacher`, `accountant`, `hostel_warden`, `student`, and `parent`.
- All Global Owner database authorization requires the bound Auth user and AAL2 (verified MFA).
- Never place passwords, service-role keys, Resend API keys, cron secrets or database credentials in Git, tickets, chat messages or browser-visible environment variables.
- Do not apply repository migration `00007_security_hardening.sql`; it contains legacy `super_admin` assumptions and is excluded from this target architecture.
- Do not merge or deploy this branch to Production until the release gates in section 8 are met.

## 2. Initial Global Owner account setup

1. The designated Auth account already exists in Development and is verified. Its UUID is already bound to the singleton `private.platform_owner` record.
2. Owner binding is no longer performed by the browser, a public RPC, or an Auth trigger. Migration `00042_retire_legacy_owner_binding.sql` removes those legacy paths after verifying the trusted binding exists.
3. Open `/platform/login` on the branch-specific Development Preview and sign in with the existing designated account.
4. The login flow checks the authenticated UUID against the trusted singleton binding before it permits TOTP enrollment. On first successful sign-in, scan the QR code with an authenticator app and verify the six-digit code.
5. After MFA verification, `private.is_platform_owner()` requires both the bound UUID and AAL2. Dashboard and every server action re-check that authorization.
6. Confirm the owner dashboard opens and that a non-owner account cannot open `/platform`. Do not create a second Global Owner or grant tenant roles as a substitute.

## 3. Madrasa application lifecycle

1. Applicant submits the public form at `/register-madrasa`. No Auth account or tenant is created at this stage.
2. The application RPC validates the payload, applies a three-per-email-per-24-hour submission limit, stores a hash plus nonce for a random HMAC-derived upload capability and queues an application-received email. The web form also includes a honeypot; this is baseline abuse friction, not a replacement for IP/CAPTCHA protection.
3. Applicant uses the private, seven-day document link to upload PDF/JPEG/PNG supporting documents (maximum 10 MB each; upload capability permits up to 10 files).
4. Global Owner reviews the application and each document in `/platform`. Documents can be marked verified or rejected with a review note.
5. If more information is needed, set the application to `info_requested`; the applicant can continue uploading with the original unexpired capability link.
6. Invitation issuance is blocked until at least one supporting document is verified and no document remains pending review. Rejected documents remain in the audit history; applicants can submit replacements while information is requested.
7. Invitation tokens are random, single-use, stored as hashes and expire after 72 hours. Delivery is queued through the transactional outbox.
8. Applicant creates or signs in to the invited email account, verifies that email and accepts the invitation. The database provisions the tenant, Main Campus, academic year, curriculum defaults and initial Madrasa Admin membership in one transaction.
9. New tenant remains `pending_activation`. Middleware restricts the tenant to onboarding until the Global Owner performs final activation after onboarding completion.

## 4. Resend and email outbox setup

Email delivery is **blocked** until a sender domain owned by the organization is verified in Resend and all required secrets are configured.

- The account currently has no Resend sending domains.
- The user confirmed there is no other owned domain available. Resend rejected the attempted `notify.sahitech.dpdns.org` sender domain because free public/dynamic DNS domains are not accepted as owned sending domains.
- The website domain `sahitech.dpdns.org` is verified on Vercel, but that does not make it an eligible owned email-sending domain.
- No email has been sent from this branch. Do not invent a sender address or try another subdomain of the same free DNS domain.

### Web deployment environment

Set the canonical HTTPS origin and the server-only token derivation secret:

- `NEXT_PUBLIC_SITE_URL` — actual HTTPS origin of the MDI web deployment, if used by the web app.
- `MDI_EMAIL_TOKEN_HMAC_SECRET` — at least 32 cryptographically random bytes, kept server-only. Generate locally with `openssl rand -hex 32`, then use the exact same value in the web deployment and the Supabase Edge Function. Do not use a `NEXT_PUBLIC_` prefix or paste the value into chat/Git.

### Supabase Edge Function secrets

Configure these in the **development** Supabase project using its secret-management interface:

- `CRON_SECRET` — long random secret used to authenticate scheduled calls.
- `PUBLIC_SITE_URL` — same canonical HTTPS origin as the web deployment.
- `MDI_EMAIL_TOKEN_HMAC_SECRET` — exact same server-only HMAC secret as the web deployment.
- `RESEND_API_KEY` — Resend API key.
- `RESEND_FROM_EMAIL` — sender identity on the verified Resend domain.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — Supabase function runtime credentials.

Configure Supabase Auth SMTP separately for sign-up confirmation and password recovery. Add the exact `/auth/callback` URL to the Supabase Auth redirect allowlist.

Deploy `supabase/functions/process-email-outbox/index.ts` with JWT verification disabled only because the function validates `Authorization: Bearer <CRON_SECRET>` itself. Configure an external scheduler or Supabase Cron to POST to the function endpoint at a short interval (for example, every five minutes).

**Current deployment state:** `process-email-outbox` is ACTIVE in Production (version 1); no Edge Function is deployed in Development. This does not make email delivery ready: there is still no eligible verified sender domain, and no end-to-end email delivery test has been completed. Do not mark application/invitation email delivery as operational until a verified sender and a real received test email are evidenced.

## 5. Development validation

Run from the monorepo root:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm --filter web exec tsc --noEmit
pnpm --filter web lint
pnpm --filter web build
```

The database smoke checks should confirm:

- All public tables have RLS enabled.
- Anonymous clients cannot directly insert/update/delete Madrasa application rows.
- Public application submission is available only through the validated RPC.
- Applicant document uploads require the private capability token and an allowed application state.
- Owner review and invitation RPCs require AAL2.
- Invitation issuance requires verified supporting documents.
- Tenant activation requires an accepted invitation and completed onboarding.
- No test tenant, application, document or outbox row remains after rollback-only tests.

## 6. Verified implementation and CI state (2026-11-14)

- Current Owner hardening branch head at this runbook update: `a1417d69044020c21bd71d39dedf02ae62e5772f`.
- Pull request #4 is **OPEN, DRAFT, NOT MERGED**: https://github.com/SahiTech/SahiTech-Education/pull/4.
- GitHub Actions `MDI CI` run #247 passed for commit `b0a8eb41a488c57ff49151c3e22a48b261f3b997`; run #248 is running for the latest head `a1417d69044020c21bd71d39dedf02ae62e5772f`.
- Development migrations through `00042` are applied. Production migration history still contains only the six baseline migrations.
- Development snapshot: 37 public tables were observed and all 37 had RLS enabled; 37 tenant-aware composite foreign keys were added. Rollback-only SQL smoke tests passed for the documented owner/tenant lifecycle and upload/outbox flows, leaving no test records.
- Production database has not been modified by this release work. The Owner hardening migrations `00041` and `00042` were applied only to Development.
- Repository migration `00007_security_hardening.sql` remains intentionally excluded because it assumes legacy `super_admin` tenant privileges. A reviewed replacement/bridge migration sequence must be designed and rehearsed against a Production clone/restore before any Production schema change.
- A Vercel Preview deployment for the Owner hardening branch is queued for commit `a1417d69044020c21bd71d39dedf02ae62e5772f`; it is not yet confirmed READY or browser-tested.
- Five branch-specific Preview variables have been configured for this feature branch, pointing only to `sahitech-mdi-dev` and its publishable key. No Production variables were changed. No server-only release secrets were added to Preview.
- `sahitech.dpdns.org` is verified on Vercel and currently points to the existing Production deployment from `main`; it does not serve this feature branch. No DNS change is needed merely to retain the existing website domain.
- The Vercel project has SSO protection configured except for custom domains. Custom-domain access therefore requires application-level authentication to be verified before routing the domain to a new deployment.
- Production Supabase advisors report four anon-callable and four authenticated-callable SECURITY DEFINER functions in the baseline schema. Development advisors after migration 00042 report seven anon-callable and fourteen authenticated-callable SECURITY DEFINER functions. The removed authenticated-callable warning was the legacy `bind_platform_owner()` RPC. Remaining warnings must be reviewed individually; do not blanket-revoke.
- Development Owner identity is bound, but there are currently no registered TOTP factors for it. The Owner must complete the first-time authenticator enrollment through the Development Preview.
- Production has `process-email-outbox` ACTIVE (version 1); Development has no Edge Function. Resend still has no eligible sending domain.
- Development leaked-password protection remains disabled according to Supabase Security Advisor; enable it in project Auth settings if the plan supports it.

## 7. Current release assessment

**NOT READY FOR PRODUCTION.** CI success proves the checked code passed the configured automated checks; it does not prove Production schema compatibility, live authentication, email delivery, custom-domain behavior or browser E2E.

The existing Production website and database should remain unchanged while the handoff reviewer performs the remaining checks. A Preview deployment being READY is not equivalent to a Production release.

## 8. Production release gates — NOT CLEARED

Do not merge or deploy until all applicable items are completed and evidenced:

- [ ] Deploy the current PR head to Preview and confirm its exact commit SHA.
- [ ] Reconcile the Production migration path against the actual six-migration baseline. Do not apply legacy migration 00007; design and test an explicit replacement/bridge migration sequence against a Production clone/restore.
- [ ] Re-run and review Security, Performance and Health advisors after migration rehearsal. Verify intended caller, function body, search_path and grants individually for SECURITY DEFINER RPCs.
- [ ] Complete the designated Global Owner's first TOTP enrollment in Development Preview and verify AAL2 access; test non-owner rejection.
- [ ] Complete browser E2E with real test accounts: public application, private document upload, owner review, invitation delivery, verified-email acceptance, tenant provisioning, sequential onboarding, pending-activation lockout and owner activation.
- [ ] Obtain an eligible owned email-sending domain, verify it in Resend, configure Supabase Auth SMTP and outbox secrets, deploy/schedule the Edge Function in Development, and pass an end-to-end delivery test. Email remains a separate MDI workflow blocker and is not required for Owner login.
- [ ] Add production-grade public abuse controls (e.g. Turnstile with server-side verification and/or edge IP rate limiting); honeypot and per-email cap are insufficient alone for public launch.
- [ ] Verify canonical HTTPS origin, callback/redirect allowlists, cookie/session behavior, custom-domain routing, TLS certificate and login/authorization behavior on the custom domain.
- [ ] Verify Vercel environment variables for the intended target without exposing values; set only the required secrets through the secure dashboard.
- [ ] Produce a Production backup/restore and rollback plan, then obtain explicit approval for the Production database migration and deployment.

**Handoff recommendation:** the reviewer may inspect the Draft PR and current Preview deployment, run additional tests in Development/Preview, and prepare a written Production migration/deployment plan. They must not merge the PR, change the custom-domain alias, apply Production migrations or deploy to Production until the release gates are signed off and the owner explicitly approves the Production change.
