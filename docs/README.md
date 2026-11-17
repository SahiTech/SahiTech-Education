# SahiTech Education — MDI Documentation Index

**Parent brand:** SahiTech  
**Division:** SahiTech Education  
**Initiative:** Madrasa Digitalization Initiative (MDI)  
**Documentation policy:** Living specifications — source code, migrations, tests and verified environment state determine current implementation.

> **Agent entry point:** Read the root [AGENTS.md](../AGENTS.md), then this index and [Documentation Governance](./DOCUMENTATION_GOVERNANCE.md) before making changes. Do not assume every specification describes a feature that is already implemented.

## How to use this documentation

1. Start with the numbered specification matching the task.
2. Follow its cross-references and inspect the corresponding source, tests, SQL migrations and configuration.
3. Keep the relevant documents synchronized in the same branch/PR as the code.
4. Mark features as implemented only after code and tests support the claim; mark deployed/production-verified only after checking that environment.
5. Use [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) as a dated evidence snapshot, not as an authoritative live dashboard.

## Numbered specifications and supporting documents

| Document | Purpose |
|---|---|
| [01_PROJECT_OVERVIEW.md](./01_PROJECT_OVERVIEW.md) | Mission, brand hierarchy, product positioning, market scope. |
| [02_PRODUCT_AND_BUSINESS_REQUIREMENTS.md](./02_PRODUCT_AND_BUSINESS_REQUIREMENTS.md) | Product goals, institutional needs, business requirements and pilot criteria. |
| [03_FUNCTIONAL_AND_NON_FUNCTIONAL_REQUIREMENTS.md](./03_FUNCTIONAL_AND_NON_FUNCTIONAL_REQUIREMENTS.md) | Functional scope, quality attributes, accessibility and performance requirements. |
| [04_USER_PERSONAS_AND_JOURNEYS.md](./04_USER_PERSONAS_AND_JOURNEYS.md) | User roles, personas, journeys and key workflows. |
| [05_FEATURE_CATALOG.md](./05_FEATURE_CATALOG.md) | Platform modules and feature inventory. |
| [06_SYSTEM_ARCHITECTURE.md](./06_SYSTEM_ARCHITECTURE.md) | Application topology, runtime layers, monorepo boundaries and dependencies. |
| [07_DOMAIN_ARCHITECTURE.md](./07_DOMAIN_ARCHITECTURE.md) | Bounded contexts, domain models, aggregates and business rules. |
| [08_DATABASE_ARCHITECTURE_AND_ERD.md](./08_DATABASE_ARCHITECTURE_AND_ERD.md) | Relational model, constraints, indexes and schema relationships. |
| [09_MULTI_TENANCY_ARCHITECTURE.md](./09_MULTI_TENANCY_ARCHITECTURE.md) | Tenant isolation, tenant context, RLS and routing model. |
| [10_AUTHENTICATION_AND_AUTHORIZATION.md](./10_AUTHENTICATION_AND_AUTHORIZATION.md) | Identity, sessions, roles, permissions and authorization lifecycle. |
| [11_SECURITY_AND_THREAT_MODEL.md](./11_SECURITY_AND_THREAT_MODEL.md) | Threats, security controls, trust boundaries and hardening standards. |
| [12_QAWMI_ACADEMIC_SPECIFICATION.md](./12_QAWMI_ACADEMIC_SPECIFICATION.md) | Qawmi academic structure, curriculum configuration and result rules. |
| [13_ALIA_ACADEMIC_SPECIFICATION.md](./13_ALIA_ACADEMIC_SPECIFICATION.md) | Alia/BMEB academic structure, grading and subject configuration. |
| [14_FRONTEND_AND_DESIGN_SYSTEM.md](./14_FRONTEND_AND_DESIGN_SYSTEM.md) | Shared UI architecture, tokens, responsive behavior and accessibility. |
| [15_LOCALIZATION_AND_RTL.md](./15_LOCALIZATION_AND_RTL.md) | Bangla, English and Arabic localization, direction and formatting. |
| [16_API_AND_INTEGRATION_STANDARDS.md](./16_API_AND_INTEGRATION_STANDARDS.md) | External providers, API contracts, adapters and integration security. |
| [17_AI_AND_AUTOMATION_ARCHITECTURE.md](./17_AI_AND_AUTOMATION_ARCHITECTURE.md) | AI boundaries, automation workflows, privacy and human approval. |
| [18_MOBILE_AND_OFFLINE_ARCHITECTURE.md](./18_MOBILE_AND_OFFLINE_ARCHITECTURE.md) | Responsive/mobile experience, offline behavior and synchronization. |
| [19_TESTING_AND_QUALITY_ASSURANCE.md](./19_TESTING_AND_QUALITY_ASSURANCE.md) | Test strategy, test layers, quality gates and release verification. |
| [20_ENGINEERING_STANDARDS.md](./20_ENGINEERING_STANDARDS.md) | Coding conventions, repository workflow, reviews and engineering quality. |
| [21_DEPLOYMENT_MONITORING_AND_DISASTER_RECOVERY.md](./21_DEPLOYMENT_MONITORING_AND_DISASTER_RECOVERY.md) | Environments, deployment, observability, backups and recovery. |
| [22_BUSINESS_MODEL_AND_SUSTAINABILITY.md](./22_BUSINESS_MODEL_AND_SUSTAINABILITY.md) | Sustainability, pricing assumptions, operational cost and adoption. |
| [23_IMPLEMENTATION_ROADMAP.md](./23_IMPLEMENTATION_ROADMAP.md) | Phases, dependencies, milestones and delivery sequencing. |
| [24_RISK_REGISTER.md](./24_RISK_REGISTER.md) | Product, operational, security, legal and adoption risks. |
| [25_ARCHITECTURE_DECISION_RECORDS.md](./25_ARCHITECTURE_DECISION_RECORDS.md) | Accepted architectural decisions and their trade-offs. |
| [26_FINANCIAL_ACCOUNTING_SPECIFICATION.md](./26_FINANCIAL_ACCOUNTING_SPECIFICATION.md) | Ledger invariants, double-entry accounting and fund segregation. |
| [27_INSTITUTIONAL_SUPPORT_AND_AUDIT_PROTOCOL.md](./27_INSTITUTIONAL_SUPPORT_AND_AUDIT_PROTOCOL.md) | Support access, auditability and institutional control. |
| [28_PUBLIC_WEBSITE_ISLAMIC_DESIGN_SPEC.md](./28_PUBLIC_WEBSITE_ISLAMIC_DESIGN_SPEC.md) | Public-site brand, visual system, homepage, content, accessibility and acceptance contract. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Supplementary architecture overview; reconcile with numbered system architecture spec. |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Supplementary schema reference; verify against current SQL migrations. |
| [DOMAIN_MODELS.md](./DOMAIN_MODELS.md) | Supplementary domain-model reference; verify against current domain package. |
| [MDI_REQUIREMENTS.md](./MDI_REQUIREMENTS.md) | Concise MDI requirements summary; defer to numbered requirements specifications. |
| [README.md](./README.md) | Documentation navigation index and maintenance entry point. |
| [SECURITY_AUDIT_2026-11.md](./SECURITY_AUDIT_2026-11.md) | Dated security audit findings; treat as a point-in-time report, not a live security guarantee. |

## Additional documentation areas

- [Documentation Governance](./DOCUMENTATION_GOVERNANCE.md) — mandatory source-to-document ownership map and synchronization workflow.
- [Architecture references](./architecture/) — supporting architecture notes and diagrams.
- [Operations references](./operations/) — operational procedures and runbooks.
- [Root README](../README.md) — repository overview and setup.
- [AGENTS.md](../AGENTS.md) — mandatory engineering and documentation synchronization rules.
- [CHANGELOG.md](../CHANGELOG.md) — notable changes.
- [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) — dated implementation/environment evidence snapshot.

## Documentation status vocabulary

- **Target / Planned:** approved direction; not necessarily implemented.
- **Implemented:** code exists and relevant automated checks pass.
- **Verified:** behavior has been tested in the named environment with evidence.
- **Deployed:** the exact commit is deployed to the named environment.
- **Production-verified:** deployed behavior has been checked in production.
- **Blocked:** a named dependency or approval prevents safe completion.

Never use these terms interchangeably.

## Link and maintenance rules

- All links must be repository-relative Markdown links.
- Never add machine-specific `file:///` links, local drive paths, private paths, credentials or personal data.
- When adding/removing/renaming a document, update this index in the same change.
- See [DOCUMENTATION_GOVERNANCE.md](./DOCUMENTATION_GOVERNANCE.md) for the source-to-document ownership map and change checklist.
