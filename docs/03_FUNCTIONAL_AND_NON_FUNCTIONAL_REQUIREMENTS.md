# 03. Functional & Non-Functional Requirements

**Program:** Madrasa Digitalization Initiative (MDI)  
**Parent brand:** SahiTech  
**Division:** SahiTech Education  
**Status:** Requirements and service objectives; performance and operational values require measurement

## 1. Functional requirements

1. **Tenant and identity:** institution-scoped membership and role authorization, separate platform-owner authorization, fail-closed tenant resolution.
2. **Academic contexts:** configurable Qawmi and Alia curriculum models with versioned rules and historical result preservation.
3. **Student lifecycle:** application, review, enrollment, academic-year progression, graduation and alumni records.
4. **Attendance:** daily/session/period workflows, with an explicit online/offline state if offline sync is implemented.
5. **Examinations and credentials:** exam scheduling, controlled marks entry, review/ratification, immutable result snapshots and narrowly scoped public Sanad verification.
6. **Finance:** invoice/payment workflows, balanced accounting entries, auditability, reconciliation and restricted-fund controls subject to institutional approval.
7. **Institutional operations:** staff, hostel/boarding, notices, communication and branches as enabled by the tenant plan.
8. **Public experience:** institutional profile/site and application or verification flows with abuse controls and privacy by design.
9. **Localization:** Bangla, English and Arabic including RTL, localized metadata, validation and error states.

This list is a product requirement. Individual capability status must be checked in [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md).

## 2. Non-functional requirements

### Security and privacy
- Server-side authentication and per-operation authorization.
- PostgreSQL RLS, least-privilege grants, reviewed RPCs, secure Storage and tenant-aware relational integrity.
- No privileged secret in browser code or public documentation.
- Data minimization, safe retention and redacted logs.
- Independent authorization tests for tenant roles and platform owner.

### Reliability and integrity
- Multi-record critical workflows must be transactional and idempotent.
- Failed downstream work must not be reported as successful.
- Financial postings and ratified academic results must have explicit immutable/reversal rules.
- Background jobs must be tenant-scoped, bounded and observable.
- Backup and restore procedures must be tested.

### Performance
Set measurable budgets for:
- server-rendered initial response and Core Web Vitals;
- client JavaScript transfer and hydration cost;
- database query p50/p95 latency for representative tenant workloads;
- low-end Android interaction responsiveness;
- image/font transfer and layout stability.

Do not copy historical numbers into a “current baseline” without a dated repeatable measurement, device/network profile and test artifact. Define targets only after a representative workload and acceptance threshold have been approved.

### Accessibility and usability
- Target WCAG 2.2 AA.
- Keyboard, touch and assistive technology support.
- Responsive layout without horizontal overflow.
- Localized forms and errors.
- Arabic RTL and mixed-direction content verification.

### Portability and maintainability
- Keep domain rules independent of framework/provider details.
- Use additive, ordered and rehearsed database migrations.
- Keep providers behind typed adapters.
- Document architecture changes with ADRs.

## 3. Service objectives and measurement

Uptime, RPO, RTO, query latency and page-performance targets are operational objectives, not measured facts. For each metric record:
- target and business reason;
- measurement method and sampling window;
- environment and workload;
- current measured baseline with timestamp;
- dependency and known limitations;
- owner and remediation threshold.

No numeric SLO is treated as achieved until monitoring or a reproducible test provides evidence.

## 4. Acceptance standard

A requirement is accepted only when the relevant workflow, authorization, validation, data integrity, localization and failure states are implemented and tested. A schema object, static page, diagram or passing production build alone is not sufficient evidence.
