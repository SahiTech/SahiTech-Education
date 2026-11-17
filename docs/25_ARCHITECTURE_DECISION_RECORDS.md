# 25. Architecture Decision Records (ADR)

This file records intentional architecture decisions. A decision is not proof that its full implementation or production rollout is complete. New material decisions must include status, date, context, decision, alternatives and consequences.

## ADR-001 — Shared PostgreSQL database with tenant-scoped RLS

**Status:** Accepted design; effective environment state must be verified.

MDI uses a shared database/schema tenancy model with tenant-scoped rows and PostgreSQL RLS. RLS must be reviewed with grants, functions, views, Storage policies and relational constraints. No absolute or mathematical security guarantee is claimed.

## ADR-002 — Domain-driven modular monolith in a pnpm workspace

**Status:** Accepted and reflected in repository topology.

The workspace contains `apps/web`, `packages/domain` and `packages/database`, with Supabase Edge Function source under `supabase/functions`. There is no separate `@sahitech/ui` workspace package in the reviewed tree. Reconsider extraction only when justified by dependency/reuse boundaries.

## ADR-003 — Qawmi and Alia as configurable first-class academic contexts

**Status:** Accepted product direction.

The product should support Qawmi and Alia contexts without forcing one fixed template on every institution. Curriculum templates, grading, term structure and historical versions require domain-specific validation and institutional/board review. Documentation does not assert official recognition.

## ADR-004 — Trilingual localization with Arabic RTL

**Status:** Accepted product direction; completeness requires browser verification.

Support bn, en and ar. Runtime dictionaries are TypeScript modules in `apps/web/src/lib/i18n/dictionaries`. Locale key parity, route coverage and real RTL layout tests are required before “complete” can be claimed.

## ADR-005 — Financial ledger and restricted charitable funds

**Status:** Product/architecture direction; production enforcement not assumed.

Design a double-entry ledger with balanced transactional posting, immutable posted entries and reversal records. Zakat/Lillah classifications and eligibility rules require approval from qualified Shariah/institutional authorities. TypeScript checks alone are not database enforcement.

## ADR-006 — Cryptographically verifiable Sanad

**Status:** Accepted direction; current issuance and public disclosure require security verification.

Use cryptographically secure, high-entropy verification tokens stored hashed, with single-purpose public verification and minimal output. Do not claim a certificate is accredited or universally recognized without authoritative evidence.

## ADR-007 — Offline-capable classroom workflows

**Status:** Target architecture; not verified as end-to-end implementation in reviewed tree.

Attendance drafts may be considered for offline operation after service-worker, local data protection, server reauthorization, idempotency and conflict behavior are designed and tested. Financial, owner and Sanad finalization remain online-only.

## ADR-008 — Documentation as part of code delivery

**Status:** Accepted on 2026-11-17.

Every meaningful code change must include a documentation impact review and same-PR updates to affected Markdown files. `AGENTS.md` points to `docs/DOCUMENTATION_SYNC_POLICY.md`, which defines the change-to-document map, evidence labels, source-of-truth order and completion checklist.

Consequences:
- stale docs are treated as a quality defect;
- planned/source-implemented/dev-verified/production-verified states are distinct;
- repo-relative links are required;
- implementation status and changelog are updated only with evidence;
- architecture changes require an ADR.
