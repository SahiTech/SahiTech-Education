# MDI Global Platform Owner & Release Operations Runbook

**Status:** Draft for development and controlled release  
**Owner identity:** `helpline.sahitech@gmail.com`  
**Development project:** `sahitech-mdi-dev` (`srcmodeinjvfqwkramni`)  
**Production project:** `sahitech-mdi` (`xbswamfmslhliayoowlo`)

## 1. Security boundaries

- The Global Platform Owner is a singleton platform identity, not a tenant role.
- Tenant roles are limited to `madrasa_admin`, `academic_dean`, `teacher`, `accountant`, `hostel_warden`, `student`, and `parent`.
- All Global Owner database authorization requires the bound Auth user and AAL2 (verified MFA).
- Never place passwords, service-role keys, Resend API keys, cron secrets or database credentials in Git, tickets, chat messages or browser-visible environment variables.
- Do not apply repository migration `00007_security_hardening.sql`; it contains legacy `super_admin` assumptions and is excluded from this target architecture.
- Do not deploy or merge this branch to production until the release gates in section 7 are met.

## 2. Initial Global Owner account setup

1. In the **development** Supabase project, create the Auth user using the exact designated email `helpline.sahitech@gmail.com`.
2. Complete the email verification flow. The database trigger `private.bind_verified_platform_owner()` binds the verified account to the singleton owner record. The login action also calls the guarded owner-binding RPC, which is idempotent for the same account.
3. Open `/platform/login` on the development web deployment and sign in with that account.
4. On first login, scan the TOTP QR code with an authenticator app and verify the six-digit code. Store recovery material securely outside the application.
5. Confirm the owner dashboard opens and that a non-owner account cannot open `/platform`.
6. Do not create a second Global Owner or grant `madrasa_admin`/other tenant roles to the Global Owner as a substitute.

## 3. Madrasa application lifecycle

1. Applicant submits the public form at `/register-madrasa`. No Auth account or tenant is created at this stage.
2. The application RPC validates the payload, applies an email-based submission limit, stores a hash of a random upload capability and queues an application-received email.
3. Applicant uses the private, seven-day document link to upload PDF/JPEG/PNG supporting documents (maximum 10 MB each; upload capability permits up to 10 files).
4. Global Owner reviews the application and each document in `/platform`. Documents can be marked verified or rejected with a review note.
5. If more information is needed, set the application to `info_requested`; the applicant can continue uploading with the original unexpired capability link.
6. Invitation issuance is blocked until at least one supporting document is verified and no document remains pending review. Rejected documents remain in the audit history; applicants can submit replacements while information is requested.
7. Invitation tokens are random, single-use, stored as hashes and expire after 72 hours. Delivery is queued through the transactional outbox.
8. Applicant creates or signs in to the invited email account, verifies that email and accepts the invitation. The database provisions the tenant, Main Campus, academic year, curriculum defaults and initial Madrasa Admin membership in one transaction.
9. New tenant remains `pending_activation`. Middleware restricts the tenant to onboarding until the Global Owner performs final activation after onboarding completion.

## 4. Resend and email outbox setup

Email delivery is **not ready** until a sender domain is verified in Resend and all required secrets are configured.

### Web deployment environment

Set the canonical HTTPS origin:

- `NEXT_PUBLIC_SITE_URL` — e.g. the actual HTTPS origin of the MDI web deployment.

### Supabase Edge Function secrets

Configure these in the **development** Supabase project using its secret-management interface:

- `CRON_SECRET` — long random secret used to authenticate scheduled calls.
- `PUBLIC_SITE_URL` — same canonical HTTPS origin as the web deployment.
- `RESEND_API_KEY` — Resend API key.
- `RESEND_FROM_EMAIL` — sender identity on the verified Resend domain.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — Supabase function runtime credentials.

Configure Supabase Auth SMTP separately for sign-up confirmation and password recovery (it may use the same verified Resend domain, but it is not the application outbox). Add the exact `/auth/callback` URL to the Supabase Auth redirect allowlist. Invitation and upload bearer tokens are placed in URL fragments so they are not sent in the initial HTTP request or normal server access logs; after confirming a new account email, the applicant reopens the original invitation email link.

Deploy `supabase/functions/process-email-outbox/index.ts` with JWT verification disabled only because the function validates `Authorization: Bearer <CRON_SECRET>` itself. Configure an external scheduler or Supabase Cron to POST to the function endpoint at a short interval (for example, every five minutes). The worker claims jobs with a lease, sends via Resend and records success/failure with bounded retries.

**No Edge Function has been deployed and no email has been sent from this branch.** The connected Resend account previously had no verified sending domain.

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

## 6. Current development state (2026-11-13)

- Development migrations through `00037` are applied.
- 37 public tables were observed and all 37 had RLS enabled. Migration `00036` makes operational tenant policies require `platform_status='active'` and grants pending tenants only narrowly scoped onboarding reads/writes. Migration `00037` adds indexes for the 14 uncovered foreign keys and fixes both Auth RLS initplan warnings on profile policies.
- Application submission, upload capability, application-received outbox enqueue, private Storage object policy and document metadata registration passed rollback-only SQL smoke tests. No test Auth users, tenants, application rows, document metadata, Storage objects or outbox rows remained afterward.
- No test records remained after that test.
- GitHub Actions run #217 completed successfully: all 25 domain/database tests, TypeScript check, web lint and production build passed. Latest run #221 is validating the FK-index migration and CI trigger cleanup.
- Production project was not modified.

## 7. Release gates

Do not merge or deploy until all of the following are true:

- [ ] Latest GitHub Actions run passes domain tests, TypeScript, lint and production build.
- [ ] Global Owner Auth account is verified, bound and protected by TOTP MFA (AAL2).
- [ ] Browser E2E covers application submission, private document upload, owner review, invitation email, verified-email acceptance, onboarding and final activation.
- [ ] Resend sender domain is verified and test delivery succeeds from the development environment.
- [ ] Edge Function is deployed and scheduled in development with secrets configured.
- [ ] RLS, grants, Storage policies, tenant lifecycle and audit controls are rechecked.
- [ ] Production migration plan is reviewed separately, including a redesigned replacement for excluded migration 00007.
- [ ] Explicit approval is obtained for production migration/deployment.

