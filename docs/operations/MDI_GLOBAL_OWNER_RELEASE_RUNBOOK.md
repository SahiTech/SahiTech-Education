# MDI Global Platform Owner & Release Operations Runbook

**Status:** Draft — development implementation; Production release NOT READY  
**Owner identity:** `helpline.sahitech@gmail.com`  
**Development project:** `sahitech-mdi-dev` (`srcmodeinjvfqwkramni`)  
**Production project:** `sahitech-mdi` (`xbswamfmslhliayoowlo`)  
**Feature branch:** `feat/mdi-production-hardening`  
**Pull request:** https://github.com/SahiTech/SahiTech-Education/pull/1

## 1. Security boundaries

- The Global Platform Owner is a singleton platform identity, not a tenant role.
- Tenant roles are limited to `madrasa_admin`, `academic_dean`, `teacher`, `accountant`, `hostel_warden`, `student`, and `parent`.
- All Global Owner database authorization requires the bound Auth user and AAL2 (verified MFA).
- Never place passwords, service-role keys, Resend API keys, cron secrets or database credentials in Git, tickets, chat messages or browser-visible environment variables.
- Do not apply repository migration `00007_security_hardening.sql`; it contains legacy `super_admin` assumptions and is excluded from this target architecture.
- Do not merge or deploy this branch to Production until the release gates in section 8 are met.

## 2. Initial Global Owner account setup

1. In the **development** Supabase project, create the Auth user using the exact designated email `helpline.sahitech@gmail.com`.
2. Complete the email verification flow. The database trigger `private.bind_verified_platform_owner()` binds the verified account to the singleton owner record. The login action also calls the guarded owner-binding RPC, which is idempotent for the same account.
3. Open `/platform/login` on the development web deployment and sign in with that account.
4. On first login, scan the TOTP QR code with an authenticator app and verify the six-digit code. Store recovery material securely outside the application.
5. Confirm the owner dashboard opens and that a non-owner account cannot open `/platform`.
6. Do not create a second Global Owner or grant `madrasa_admin`/other tenant roles to the Global Owner as a substitute.

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

**No Edge Function has been deployed in either Supabase project.** Do not mark email or invitation delivery as end-to-end tested until a verified sender domain exists and a real test email is received.

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

- Feature branch head at review: `a876b48558e95c2d29e6a0aeaa55ac8e3ae73ba7`.
- Pull request #1 is **OPEN, DRAFT, mergeable, NOT MERGED**. It contains 178 commits and 76 changed files (+5,398 / -569).
- GitHub Actions workflow `MDI CI` run **#243** for the current PR head completed successfully. The previously recorded run #239 is no longer the latest run for this exact head.
- Development migrations through `00040` are applied. Production migration history contains only the six baseline migrations.
- Development snapshot: 37 public tables were observed and all 37 had RLS enabled; 37 tenant-aware composite foreign keys were added. Rollback-only SQL smoke tests passed for the documented owner/tenant lifecycle and upload/outbox flows, leaving no test records.
- Production database has not been modified by this release work.
- Repository migration `00007_security_hardening.sql` remains intentionally excluded because it assumes legacy `super_admin` tenant privileges. A reviewed replacement/bridge migration sequence must be designed and rehearsed against a Production clone/restore before any Production schema change.
- Latest Vercel Preview deployment for `feat/mdi-production-hardening` is READY, but it serves commit `485e4cb8305cb9304132108a0035494cad49149a`, not the current PR head `a876b48558e95c2d29e6a0aeaa55ac8e3ae73ba7`. Therefore the current PR head has not yet been confirmed deployed to Preview.
- Vercel Preview environment-variable query for this feature branch returned no branch-specific variables. The Production environment query showed only five public frontend configuration variables and no hidden Production variables; no server-only MDI release secret was verified there. Never expose or copy encrypted values.
- `sahitech.dpdns.org` is verified on Vercel and currently points to the existing Production deployment from `main`; it does not serve this feature branch. No DNS change is needed merely to retain the existing website domain.
- The Vercel project has SSO protection configured except for custom domains. Custom-domain access therefore requires application-level authentication to be verified before routing the domain to a new deployment.
- Production Supabase advisors report four anon-callable and four authenticated-callable SECURITY DEFINER functions in the baseline schema. Development advisors report seven anon-callable and fifteen authenticated-callable SECURITY DEFINER functions. Review each function body, search_path and ACL individually; do not blanket-revoke.
- Neither Supabase project has the outbox Edge Function deployed. Resend has no eligible sending domain, and the user has confirmed no other owned domain is available.
- Configuration-template note: `.env.example` currently repeats the `MDI_EMAIL_TOKEN_HMAC_SECRET` entry. Clean up this duplicate during the next documentation/configuration pass.

## 7. Current release assessment

**NOT READY FOR PRODUCTION.** CI success proves the checked code passed the configured automated checks; it does not prove Production schema compatibility, live authentication, email delivery, custom-domain behavior or browser E2E.

The existing Production website and database should remain unchanged while the handoff reviewer performs the remaining checks. A Preview deployment being READY is not equivalent to a Production release.

## 8. Production release gates — NOT CLEARED

Do not merge or deploy until all applicable items are completed and evidenced:

- [ ] Deploy the current PR head to Preview and confirm its exact commit SHA.
- [ ] Reconcile the Production migration path against the actual six-migration baseline. Do not apply legacy migration 00007; design and test an explicit replacement/bridge migration sequence against a Production clone/restore.
- [ ] Re-run and review Security, Performance and Health advisors after migration rehearsal. Verify intended caller, function body, search_path and grants individually for SECURITY DEFINER RPCs.
- [ ] Configure and verify the designated Global Owner Auth identity and TOTP MFA (AAL2) in Development.
- [ ] Complete browser E2E with real test accounts: public application, private document upload, owner review, invitation delivery, verified-email acceptance, tenant provisioning, sequential onboarding, pending-activation lockout and owner activation.
- [ ] Obtain an eligible owned email-sending domain, verify it in Resend, configure Supabase Auth SMTP and outbox secrets, deploy/schedule the Edge Function in Development, and pass an end-to-end delivery test. Until then email delivery is an acknowledged blocker.
- [ ] Add production-grade public abuse controls (e.g. Turnstile with server-side verification and/or edge IP rate limiting); honeypot and per-email cap are insufficient alone for public launch.
- [ ] Verify canonical HTTPS origin, callback/redirect allowlists, cookie/session behavior, custom-domain routing, TLS certificate and login/authorization behavior on the custom domain.
- [ ] Verify Vercel environment variables for the intended target without exposing values; set only the required secrets through the secure dashboard.
- [ ] Produce a Production backup/restore and rollback plan, then obtain explicit approval for the Production database migration and deployment.

**Handoff recommendation:** the reviewer may inspect the Draft PR and current Preview deployment, run additional tests in Development/Preview, and prepare a written Production migration/deployment plan. They must not merge the PR, change the custom-domain alias, apply Production migrations or deploy to Production until the release gates are signed off and the owner explicitly approves the Production change.
