# 23. Implementation Roadmap

**Strategy:** dependency-aware vertical delivery  
**Status:** living target roadmap; dates and phase status must be revalidated against source and evidence

## 1. Delivery tracks

MDI work should be organized into dependency-aware tracks rather than assigning completion by elapsed dates.

| Track | Scope | Exit evidence |
|---|---|---|
| A. Identity and governance | Auth, Global Owner, tenant lifecycle, invitations, RBAC | MFA and non-owner tests, lifecycle integration tests |
| B. Tenant core | Tenant context, onboarding, institution profile and branches | Isolated tenant setup and fail-closed isolation tests |
| C. Student and academic | Admissions, SIS, Qawmi/Alia configuration, exams and results | End-to-end enrollment, curriculum versioning and ratification tests |
| D. Operations | Attendance, staff, hostel and public institution site | Authorized workflows, state and audit tests |
| E. Finance | Fees, payments, double-entry ledger, restricted funds | Atomic posting/reversal and accounting review |
| F. Sanad | Issuance, public verification, revocation | Secure random tokens, minimal public response and lifecycle tests |
| G. Integrations | Transactional email, SMS/payment adapters and storage | Provider sandbox and real end-to-end verification |
| H. Experience and quality | Localization, responsive UX, accessibility and performance | Browser coverage for bn/en/ar and target device widths |
| I. Production readiness | Migration rehearsal, monitoring, backup/restore and incident response | Signed release checklist and explicit approval |

## 2. Source implementation snapshot

The reviewed repository contains web routes, server actions, domain modules, ordered SQL migrations through 00045, a Supabase Edge Function source and a CI workflow. This confirms source assets exist; it does not establish full feature completeness or a deployed state.

Use [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) for the dated evidence snapshot. It must be updated only when new source/test/runtime evidence is obtained.

## 3. Priority sequence

### P0 — Release blockers and trustworthy baseline
- Remediate the static fallback password and credential-return behavior identified in migration 00045.
- Reconcile current development and production migration states; do not assume repository migrations are applied.
- Review RLS, function grants, Storage policies and tenant-aware constraints as a combined system.
- Add transactional guarantees to multi-step provisioning/admission and finance operations.
- Replace placeholder database testing with executable isolated database tests.
- Add E2E for owner, invitation and tenant lifecycle.

### P1 — Core product completeness
- Verify all current student, academic, exam, attendance, finance, hostel, teacher and Sanad flows end-to-end.
- Ensure tenant/role-specific data visibility is least-privilege.
- Confirm all locale dictionaries and accessible RTL components.
- Remove unsupported live/protection metrics from user interfaces and marketing.

### P2 — Operational readiness
- Verify transactional email delivery with an eligible verified sender.
- Introduce provider adapters only with secure configuration and successful tests.
- Add operational health, alerting, backup/restore and incident response evidence.
- Complete mobile/low-bandwidth and responsive-browser coverage.

### P3 — Optional expansion
- PWA/offline synchronization;
- AI-assisted document extraction and notice drafting;
- prayer-time/Qibla/Hijri utilities;
- newsletter and editorial publishing;
- advanced analytics and further regional/international configuration.

Each optional feature requires its own product decision, privacy review and acceptance criteria. Do not let planned tools appear as current capabilities.

## 4. Definition of done

A vertical feature is done only when:
- business rules and authorization are implemented at the correct layers;
- database changes are forward-only, reconciled and tested;
- errors, concurrency, retries and audit effects are covered;
- user flows are usable in all supported locales;
- automated checks and manual/browser evidence are recorded;
- relevant documentation is synchronized in the same PR;
- production actions have explicit approval.
