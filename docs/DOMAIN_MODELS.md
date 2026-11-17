# MDI Domain Models — Supplemental Overview

**Status:** Summary of intended domain concepts. Current TypeScript source and numbered specs are authoritative.

The domain package is intended to keep business rules portable and separate from web framework and provider SDKs.

## Academic contexts
- Qawmi: institution-configurable Marhala, Kitab, term and grading structures.
- Alia: configurable board/curriculum tiers, subjects, assessment and grading versions.
- Historical academic outcomes must retain the rule/template version used at the time.

See [Qawmi Specification](12_QAWMI_ACADEMIC_SPECIFICATION.md) and [Alia Specification](13_ALIA_ACADEMIC_SPECIFICATION.md). Exact board or institution rules require authoritative validation before production use.

## Other domains
- Tenancy and membership authorization.
- Student registry, guardian linkage and admission state transitions.
- Attendance and examination workflows.
- Sanad issuance and public verification.
- Finance, double-entry validation and restricted fund policy.

A type or validator does not prove that a feature is wired into the UI or enforced by PostgreSQL. Database-level invariants require database enforcement and integration tests.

See [Domain Architecture](07_DOMAIN_ARCHITECTURE.md), [Financial Accounting](26_FINANCIAL_ACCOUNTING_SPECIFICATION.md) and [Documentation Sync Policy](DOCUMENTATION_SYNC_POLICY.md).
