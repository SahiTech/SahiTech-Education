# Documentation Governance & Source Ownership

**Applies to:** all code, database, product, UI, infrastructure and operational changes in MDI.  
**Owner:** repository maintainers; every contributor/agent is responsible for the documents affected by their change.

## 1. Non-negotiable rule

Documentation is part of the deliverable. A code change is incomplete until its affected documentation has been reviewed and updated in the same branch/PR, or the change summary explicitly explains why no documentation change is needed.

The source of truth for current behavior is the combination of source code, SQL migrations, tests, configuration and verified environment evidence. A specification describes intended rules and constraints; it does not prove implementation.

## 2. Source-to-document ownership map

| Change area | Primary documentation | Also review |
|---|---|---|
| Product scope, user value, institution eligibility | [02 Product & Business Requirements](./02_PRODUCT_AND_BUSINESS_REQUIREMENTS.md) | 01, 03, 04, 05, 22, 23, 24 |
| Functional behavior, quality targets, new features | [03 Functional & Non-Functional Requirements](./03_FUNCTIONAL_AND_NON_FUNCTIONAL_REQUIREMENTS.md) | 05, 19, 23, 24 |
| User roles, journeys, onboarding | [04 User Personas & Journeys](./04_USER_PERSONAS_AND_JOURNEYS.md) | 05, 10, 27 |
| Module addition/removal or feature behavior | [05 Feature Catalog](./05_FEATURE_CATALOG.md) | 02, 03, module specification, 19 |
| Runtime, packages, service boundaries, hosting topology | [06 System Architecture](./06_SYSTEM_ARCHITECTURE.md) | 07, 20, 21, 25 |
| Domain rules, entities, state transitions | [07 Domain Architecture](./07_DOMAIN_ARCHITECTURE.md) | 12, 13, 26, 25 |
| Tables, columns, constraints, indexes, migrations | [08 Database Architecture & ERD](./08_DATABASE_ARCHITECTURE_AND_ERD.md) | DATABASE_SCHEMA.md, 09, 10, 11, 21 |
| Tenant context, RLS, tenant routing | [09 Multi-Tenancy](./09_MULTI_TENANCY_ARCHITECTURE.md) | 08, 10, 11, 19, 27 |
| Authentication, sessions, permissions, roles | [10 Authentication & Authorization](./10_AUTHENTICATION_AND_AUTHORIZATION.md) | 09, 11, 27 |
| Threat model, cryptography, secrets, public endpoints | [11 Security & Threat Model](./11_SECURITY_AND_THREAT_MODEL.md) | 08, 09, 10, 16, 19, 21 |
| Qawmi rules, grading, terms, Sanad | [12 Qawmi Specification](./12_QAWMI_ACADEMIC_SPECIFICATION.md) | 07, 08, 13, 26 |
| Alia/BMEB rules, subjects, grading | [13 Alia Specification](./13_ALIA_ACADEMIC_SPECIFICATION.md) | 07, 08, 12 |
| Shared components, tokens, UI, accessibility | [14 Frontend & Design System](./14_FRONTEND_AND_DESIGN_SYSTEM.md) | 15, 19, 28 |
| Locale dictionaries, language switching, RTL | [15 Localization & RTL](./15_LOCALIZATION_AND_RTL.md) | 14, 19, 28 |
| API, webhooks, SMS, payment, storage, email providers | [16 API & Integration Standards](./16_API_AND_INTEGRATION_STANDARDS.md) | 11, 17, 21, 24 |
| AI features, automated decisions, background work | [17 AI & Automation](./17_AI_AND_AUTOMATION_ARCHITECTURE.md) | 03, 11, 16, 19, 24 |
| PWA, offline data, sync/conflict rules | [18 Mobile & Offline](./18_MOBILE_AND_OFFLINE_ARCHITECTURE.md) | 03, 09, 14, 19 |
| Tests, CI gates, coverage and quality checks | [19 Testing & QA](./19_TESTING_AND_QUALITY_ASSURANCE.md) | 20, 21 |
| Coding rules, package scripts, Git workflow | [20 Engineering Standards](./20_ENGINEERING_STANDARDS.md) | AGENTS.md, 06, 19 |
| Environments, deployment, monitoring, backup/restore | [21 Deployment & DR](./21_DEPLOYMENT_MONITORING_AND_DISASTER_RECOVERY.md) | 11, 16, 19, 24 |
| Pricing, operating costs, service limits | [22 Business Model](./22_BUSINESS_MODEL_AND_SUSTAINABILITY.md) | 02, 23, 24 |
| Delivery phases, dependencies and milestones | [23 Implementation Roadmap](./23_IMPLEMENTATION_ROADMAP.md) | 02, 03, 05, 24 |
| Risks, mitigations, risk acceptance | [24 Risk Register](./24_RISK_REGISTER.md) | 11, 16, 17, 21 |
| Architectural decision or material trade-off | [25 ADRs](./25_ARCHITECTURE_DECISION_RECORDS.md) | 06–11, 20 |
| Ledger, vouchers, funds, accounting invariants | [26 Financial Accounting](./26_FINANCIAL_ACCOUNTING_SPECIFICATION.md) | 07, 08, 12, 13, 19 |
| Support access, impersonation, audit | [27 Support & Audit](./27_INSTITUTIONAL_SUPPORT_AND_AUDIT_PROTOCOL.md) | 09, 10, 11, 21 |
| Public homepage, public navigation, marketing UI | [28 Public Website Design](./28_PUBLIC_WEBSITE_ISLAMIC_DESIGN_SPEC.md) | 01, 14, 15, 16, 19 |
| Cross-cutting product/architecture changes | [Architecture overview](./ARCHITECTURE.md), [Documentation index](./README.md) | 01, 06, 25, AGENTS.md |

## 3. Required change workflow

### Before coding
- Inspect the current branch and repository tree.
- Read the primary document(s) above and relevant ADRs.
- Trace the current implementation, tests, migration history and feature flags.
- Identify whether the request changes an approved business rule, security boundary, data contract or production environment. Obtain human approval before such changes.

### During coding
- Keep source, tests, migrations and docs consistent.
- For database changes, add a new forward-only migration; never edit an already-applied migration.
- For public APIs or persisted data, document compatibility, rollout and rollback considerations.
- For UI changes, update screenshots/manual verification notes where visual behavior materially changes.
- Do not add paid providers, credentials, production migrations or production deployment without explicit authorization.

### Before completion
- Update affected docs and [CHANGELOG.md](../CHANGELOG.md).
- Update [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) only when new evidence has been collected; date and scope every status snapshot.
- Update this index when documents are added, removed or renamed.
- Search changed docs for broken links, local paths, stale routes, old versions and unsupported claims.
- Run the relevant automated checks and report their actual outcomes.

## 4. Truth and status model

Use these labels consistently:

| Label | Meaning |
|---|---|
| Target / Planned | Desired architecture or approved future scope; not implemented yet. |
| Implemented | Code exists; relevant tests/checks have passed. |
| Verified | Behavior was tested in a named environment with recorded evidence. |
| Deployed | Exact commit is deployed to a named environment. |
| Production-verified | The deployed production behavior was checked after release. |
| Blocked | A dependency, permission, provider setup or decision prevents safe completion. |
| Deprecated | Still present for compatibility, but should not be used for new work. |

A route existing does not prove its backend works. A build passing does not prove runtime behavior, RLS isolation, accessibility, performance, or production health.

## 5. Version and evidence discipline

- Record the exact package/version from the relevant manifest, not memory or a badge.
- Record migration numbers from the repository and applied state from the target database separately.
- Record test command, date, environment, pass/fail count and known skips.
- Record deployment commit SHA and deployment URL/environment before calling a release deployed.
- Never write secrets or personal/student records into evidence.
- Date audit reports and preserve prior findings; add follow-up results rather than silently rewriting history.

## 6. Documentation review checklist

- [ ] Primary and cross-referenced specifications inspected.
- [ ] Source code and tests match the described behavior.
- [ ] Architecture diagrams and package/route names are current.
- [ ] Database docs match forward migrations and actual schema evidence.
- [ ] Security and tenant-isolation statements are evidence-backed.
- [ ] Locale and RTL requirements reflect actual supported behavior.
- [ ] Setup commands and environment variable names match manifests/configuration.
- [ ] No local-machine links, secrets, invented metrics or unsupported claims.
- [ ] Changelog and status snapshot updated where appropriate.
- [ ] Documentation index updated when its contents change.

## 7. Handling uncertainty

If code, tests, production state and specifications disagree:
1. Do not silently choose the most optimistic interpretation.
2. Record the discrepancy and affected surfaces.
3. Treat security, privacy, finance, academic records and production data as high-risk.
4. Preserve current production behavior until an approved migration/rollout plan exists.
5. Ask for a human decision only when the issue changes business policy, creates irreversible effects, incurs cost, or affects production.
