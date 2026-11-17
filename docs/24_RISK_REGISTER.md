# 24. Risk Register & Mitigations

**Review date:** 2026-11-17  
**Scope:** source and documentation review; live environment verification is separate

## 1. Priority risks

| ID | Risk | Priority | Mitigation / required evidence |
|---|---|---|---|
| RSK-01 | Cross-tenant data exposure through policy/grant/function gaps | Critical | Reconcile live catalog; test RLS, table grants, function execution, views, Storage and cross-tenant references |
| RSK-02 | Static fallback password and credential return path in migration 00045 | Critical | Replace with verified invitation/reset workflow; never return credentials; regression-test RPC output/logs |
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

## 2. Risk handling rules

- “Critical” means block release until verified remediation or formally accepted risk by an authorized owner.
- Do not lower severity merely because no incident has been reported.
- A source fix is not a production fix until deployed and verified.
- Keep a named owner, due date and evidence link for each active release blocker.
- Avoid storing exploitable credentials, tokens or student data in risk records.
- Re-score risks when architecture, providers, law, curriculum or deployment changes.

## 3. Immediate release blockers from source review

1. Migration 00045 static fallback password / password response field.
2. Current production/dev schema and migration compatibility not reconciled in this review.
3. Transactional guarantees for privileged provisioning and finance workflows require implementation review/tests.
4. Browser E2E and live email delivery remain unverified.
5. DB test runner and CI coverage need improvement.

See [Security & Threat Model](11_SECURITY_AND_THREAT_MODEL.md) and [Implementation Status](../IMPLEMENTATION_STATUS.md).
