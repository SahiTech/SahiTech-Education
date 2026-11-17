# 24. Risk Register & Mitigations

**Review date:** 2026-11-17  
**Scope:** source and documentation review; live environment verification is separate

## 1. Priority risks

| ID | Risk | Priority | Mitigation / required evidence |
|---|---|---|---|
| RSK-01 | Cross-tenant data exposure through policy/grant/function gaps | Critical | Reconcile live catalog; test RLS, table grants, function execution, views, Storage and cross-tenant references |
| RSK-02 | Legacy static credential and password-return path | Critical until secure Admin workflow is Production verified | Emergency 00051 and lifecycle hotfix 00052 are in Production; old credential RPC is removed, but secure feature migrations 00045–00050, required secrets and Auth E2E remain pending |
| RSK-03 | Multi-step workflows may partially commit or report success after failed writes | High | Transactional RPCs, idempotency, failure injection and rollback tests |
| RSK-04 | Financial journal invariants may rely on app validation | Critical | DB-enforced balanced posting, immutable posted entries and reversal chain; accountant review |
| RSK-05 | Production/dev migration drift | High | Compare migration ledgers and database catalogs; test a replacement migration path on a production clone |
| RSK-06 | Public application/lookup endpoints exposed to abuse | High | Server-side rate limiting, bot controls, input limits, minimal responses and abuse tests |
| RSK-07 | Public Sanad token exposure or enumeration | High | High-entropy random tokens, hash at rest, minimal verification output, expiry/revocation and rate limits |
| RSK-08 | Email worker source exists but delivery may not be operational | High | Verified sending domain, secrets, worker schedule, retry monitoring and received-message test |
| RSK-09 | Mobile/offline and AI capabilities marketed before implementation | Medium | Mark as planned; verify service worker/IndexedDB or model workflows before promotion |
| RSK-10 | Locale dictionaries drift or Arabic RTL breaks | Medium | Key parity, locale route tests and browser review at common widths |
| RSK-11 | Database test script is a placeholder and SQL smoke assumptions are historical | High | Add schema-current DB test runner and CI integration against disposable database |
| RSK-12 | Documentation becomes stale after code changes | High | Mandatory policy in AGENTS.md, change-to-doc map, same-PR update and link validation |
| RSK-13 | Backup/restore or RPO/RTO claims are unsupported | High | Verify provider plan/settings and complete restore drill before publishing objectives |
| RSK-14 | Shariah or curriculum rules overstate authority/recognition | High | Make configuration explicit and require qualified institutional/board/Shariah review |
| RSK-15 | Legacy owner_direct_provision_tenant and AAL1-capable Owner lifecycle RPCs in Production | Mitigated 2026-11-17; monitor through release | Production migration 00052 applied; read-only SQL verification confirmed the legacy RPC is absent and four lifecycle RPCs require DB AAL2. Recheck after application deployment and keep other manual-admin release blockers open |

## 2. Risk handling rules

- “Critical” means block release until verified remediation or formally accepted risk by an authorized owner.
- Do not lower severity merely because no incident has been reported.
- A source fix is not a production fix until deployed and verified.
- Keep a named owner, due date and evidence link for each active release blocker.
- Avoid storing exploitable credentials, tokens or student data in risk records.
- Re-score risks when architecture, providers, law, curriculum or deployment changes.

## 3. Immediate release blockers from source review

1. Production has emergency 00051 and security hotfix 00052, but secure feature migrations 00045–00050 remain pending; the new manual-admin provisioning workflow is not yet active.
2. Production Vercel lacks the server-only Supabase Auth Admin key and MDI_EMAIL_TOKEN_HMAC_SECRET required by the secure workflow/application upload tokens.
3. Real Supabase Auth create/login/forced-password-change/recovery E2E and backup/restore readiness remain unverified.
4. Remaining Supabase Security Advisor findings, including leaked-password protection, need individual review.

See [Security & Threat Model](11_SECURITY_AND_THREAT_MODEL.md) and [Implementation Status](../IMPLEMENTATION_STATUS.md).
