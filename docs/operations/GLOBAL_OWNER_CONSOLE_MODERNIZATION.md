# Global Platform Owner Console — Audit, Mapping & Modernization Plan

**Project:** SahiTech Education · Madrasa Digitalization Initiative (MDI)  
**Production origin:** https://sahitech.dpdns.org  
**Route:** `/platform`  
**Working branch:** `feat/global-owner-console-modernization`  
**Status:** Owner shell, session-aware navigation, overview styling, application search/status filters and operational mapping are implemented on the feature branch; Preview validation is in progress.

## 1. Access model and credential clarification

- The Global Platform Owner email/password are provisioned separately for the trusted Owner identity. They are not displayed, generated, or retrievable from the public website.
- The Owner email currently bound in `private.platform_owner` is `helpline.sahitech@gmail.com`.
- The Owner identity is bound to an existing Supabase Auth UUID; email confirmation is present.
- One verified TOTP factor exists for the Owner. The six-digit code comes from the Owner's authenticator app, not from the website.
- Never expose passwords, TOTP setup keys, QR codes, recovery secrets, service-role keys, or invitation tokens in the UI, documentation, logs, or support messages.
- Login authorization requires authenticated user + AAL2 MFA + `is_platform_owner()`. Platform server actions repeat the same checks.

## 2. Why the public Login action remained visible

- The root layout rendered `<Navbar />` without passing the current Supabase user.
- `Navbar` already accepted an optional `user` prop, but did not use it to switch the Login action.
- The navbar therefore always rendered `/login`, regardless of a valid Owner session.
- The root public navbar is also shared with `/platform`, which makes the restricted Owner console look like an ordinary public page.

**Remediation:** resolve the current user in the server root layout; make the navbar session-aware; suppress the public navbar on the restricted `/platform` route family so the Owner workspace can have its own navigation shell.

## 3. Existing Global Owner route map

| Route / component | Responsibility | Current observation |
|---|---|---|
| `/platform/login` | Owner credential + MFA login | Separate restricted login form |
| `/platform/login/owner-login-form.tsx` | Password, trusted identity check, TOTP enrollment/challenge | Verified factor should use challenge path |
| `/platform` | Owner operational dashboard | One long page; basic metric cards and stacked sections |
| `apps/web/src/app/actions/platform.ts` | Owner actions | Each action checks Owner + AAL2 |
| `private.platform_owner` | Trusted Owner binding | One singleton Owner row |
| `public.madrasa_applications` | Incoming institutional applications | 0 rows at audit time |
| `public.platform_invitations` | Invitation lifecycle | Used by approval workflow |
| `public.tenants` | Institution workspaces | 0 rows at audit time |
| `public.platform_audit_logs` | Platform lifecycle audit trail | 1 row at audit time |
| `madrasa-application-documents` | Private application documents | Signed links are short-lived (5 minutes) |
| `process-email-outbox` Edge Function | Transactional email delivery | Function active; delivery dependencies still need operational verification |

## 4. Current Owner dashboard capabilities

1. **Application intake and review**
   - Latest 100 applications are loaded.
   - Pending, under-review, information-requested, and approved-but-not-accepted invitations are surfaced.
   - Application identity, contact, requested institution code/subdomain, address, and notes are shown.
2. **Document verification**
   - Private supporting documents are listed with short-lived signed URLs.
   - Owner can verify or reject each document with an optional review note.
3. **Invitation lifecycle**
   - Owner can issue/reissue an invitation.
   - Invitation issuance is separate from tenant creation/activation.
4. **Tenant activation**
   - Only fully onboarded tenants in pending activation are listed.
   - Owner activation is a separate final decision.
5. **Audit trail**
   - Latest 40 platform lifecycle events are displayed.

## 5. Current shortcomings and risks

- Dashboard is a single long page without a proper application workspace, filters, search, detail drawer, or prioritised action queue.
- Visual hierarchy is basic; no strong distinction between overview, review queue, activation queue, and audit operations.
- No visible operational health panel for email delivery, pending/retrying outbox jobs, sender readiness, or worker heartbeat.
- The public navbar is not session-aware; login remains visible after authentication.
- The Owner route uses the shared public shell instead of a dedicated restricted console shell.
- Production email delivery cannot be declared ready from the current checks: the Edge Function is active, but required secrets, verified sender, and scheduled invocation need explicit operational verification. The web invitation action requires `MDI_EMAIL_TOKEN_HMAC_SECRET`.
- Do not perform destructive or permission-changing operations as part of visual modernization.

## 6. Proposed information architecture

### Global Owner Console
- **Overview:** key counts, pending workload, recent actions, system/service readiness.
- **Applications:** searchable/filterable application queue; status, date, district, institution type; review detail.
- **Document Review:** document checklist, preview/open action, verification state, reviewer notes.
- **Invitations:** pending/accepted/expired/revoked states and safe reissue workflow.
- **Institutions:** tenant directory, onboarding progress, activation readiness, status.
- **Audit & Security:** immutable audit timeline, actor/AAL, action, entity, time filters.
- **Operations:** email/outbox health, worker configuration status, deployment/database status; read-only unless a separately authorised operation is designed.
- **Owner Account:** identity, MFA state, active session, sign out. Never show secrets.

### UX principles
- Dedicated responsive admin shell with compact sidebar, top bar, breadcrumb, page title, context actions.
- Calm premium enterprise interface: deep emerald/ink, warm neutral surfaces, restrained accent colors, clear typography, generous spacing.
- Overview should answer: What needs attention? What is blocked? What can I do next?
- Every high-impact action must explain prerequisites and consequences; use confirmation for irreversible or external actions.
- Empty states must be useful and explicit; never fabricate counts or health status.
- Keep the public website navigation and tenant workspace navigation separate from the Global Owner console.

## 7. Implementation sequence

1. **Session-aware navigation:** resolve user in root server layout; hide Login after sign-in; keep platform routes out of the public navigation shell.
2. **Dedicated Owner shell:** restricted sidebar/topbar and mobile navigation; keep existing server-side authorization.
3. **Overview redesign:** initial visual hierarchy, attention count, activation queue and recent audit events implemented; deeper service-health widgets remain pending verified data sources.
4. **Applications workspace:** server-rendered search and status filters added for the latest 100 applications; existing document review and invitation actions retained without changing business rules.
5. **Institution and invitation views:** lifecycle visibility and action prerequisites.
6. **Audit and operations views:** read-only system health, email delivery readiness and deployment/database status.
7. **Validation:** Preview build reached READY for the current branch commit. Authenticated Owner route checks and responsive visual review still require a signed-in browser session. Deploy only after separate approval.

## 8. Baseline environment findings (2026-11-15)

- Vercel production deployment: READY; custom domain `sahitech.dpdns.org` verified.
- Supabase production project: ACTIVE_HEALTHY, PostgreSQL 17.
- 44 database migrations are recorded as applied.
- Owner identity exists, email is confirmed, and one TOTP factor is verified.
- Production database currently has 0 madrasa applications and 0 tenants; dashboard empty states are expected.
- Latest 30-minute Vercel runtime error/fatal query returned no logs. This is not a full uptime guarantee.
- Supabase Security Advisor reports 3 anon-callable and 10 authenticated-callable SECURITY DEFINER functions. Some support intended public/invitation workflows; inspect function-by-function before changing grants.
- Performance Advisor reports multiple policy/index warnings; review separately from this UI project.

## 9. Out of scope for this modernization

- No Owner password reset or account recreation.
- No MFA reset or re-enrollment.
- No production database schema/RLS/grant changes.
- No service-role or API secret rotation.
- No production environment variable changes.
- No real invitation issuance, application approval, or tenant activation during UI validation.
- No production deployment until the user explicitly approves the reviewed result.


## 10. Current feature-branch progress

- Dedicated Global Owner shell with desktop sidebar and mobile navigation is in place; the shell repeats server-side user, AAL2 and Owner checks before rendering.
- Public navbar now receives the authenticated Supabase user from the root server layout, switches the Login destination to Workspace when signed in, and is hidden across the restricted `/platform/*` route family.
- Owner overview has a branded operational header and KPI cards for the latest 100 applications, applications requiring attention, and tenants ready for activation.
- Application queue now supports server-rendered text search across institution name (English/Bangla), contact name/email/phone, district, requested code and subdomain, plus status filtering. Search is intentionally scoped to the current latest-100 review set.
- Existing owner server actions, MFA/AAL2 checks, invitation rules, document verification, tenant activation and audit reads are retained.
- Latest observed Vercel Preview for commit `16a26bc121a47e8deb2e1952ea97616b9c8d3813` reached `READY`. A newer commit containing application filters is being built; check its deployment separately before treating it as validated.
- This feature branch is not merged and has not been promoted to production.
