# SahiTech Education — MDI Documentation Index

**Parent brand:** SahiTech  
**Division:** SahiTech Education  
**Initiative:** Madrasa Digitalization Initiative (MDI)  
**Reviewed:** 2026-11-17

This index lists the Markdown documentation tracked in the repository. Specifications describe target requirements unless they explicitly cite implementation evidence. Read [Documentation Sync Policy](DOCUMENTATION_SYNC_POLICY.md) and the repository [agent rules](../AGENTS.md) before making code changes.

## Start here

| Document | Purpose |
|---|---|
| [Project README](../README.md) | Repository overview, current stack and developer commands |
| [AGENTS.md](../AGENTS.md) | Coding-agent instructions and documentation-sync requirement |
| [Documentation Sync Policy](DOCUMENTATION_SYNC_POLICY.md) | Change-to-document map, evidence labels and mandatory workflow |
| [Implementation Status](../IMPLEMENTATION_STATUS.md) | Dated source and verification snapshot; not a live system monitor |
| [Changelog](../CHANGELOG.md) | Historical and unreleased repository changes |

## Numbered product and engineering specifications

| Ref | Document | Primary scope |
|---|---|---|
| 01 | [Project Overview](01_PROJECT_OVERVIEW.md) | Mission, brand hierarchy, target markets and positioning |
| 02 | [Product & Business Requirements](02_PRODUCT_AND_BUSINESS_REQUIREMENTS.md) | Target segments, pilot eligibility and business model |
| 03 | [Functional & Non-Functional Requirements](03_FUNCTIONAL_AND_NON_FUNCTIONAL_REQUIREMENTS.md) | Product capabilities, performance and reliability objectives |
| 04 | [User Personas & Journeys](04_USER_PERSONAS_AND_JOURNEYS.md) | Institutional roles, user goals and operating journeys |
| 05 | [Feature Catalog](05_FEATURE_CATALOG.md) | Functional capability catalogue by domain |
| 06 | [System Architecture](06_SYSTEM_ARCHITECTURE.md) | Runtime topology, packages and dependency boundaries |
| 07 | [Domain Architecture](07_DOMAIN_ARCHITECTURE.md) | Bounded contexts, aggregates and domain invariants |
| 08 | [Database Architecture & ERD](08_DATABASE_ARCHITECTURE_AND_ERD.md) | Schema model, relational integrity and migration discipline |
| 09 | [Multi-Tenancy Architecture](09_MULTI_TENANCY_ARCHITECTURE.md) | Tenant resolution, RLS, isolation and background-job boundaries |
| 10 | [Authentication & Authorization](10_AUTHENTICATION_AND_AUTHORIZATION.md) | Supabase Auth, Global Owner boundary and tenant roles |
| 11 | [Security & Threat Model](11_SECURITY_AND_THREAT_MODEL.md) | Threats, defensive controls, security review and open risks |
| 12 | [Qawmi Academic Specification](12_QAWMI_ACADEMIC_SPECIFICATION.md) | Configurable Qawmi curriculum and assessment model |
| 13 | [Alia Academic Specification](13_ALIA_ACADEMIC_SPECIFICATION.md) | BMEB/Alia curriculum and grading configuration |
| 14 | [Frontend & Design System](14_FRONTEND_AND_DESIGN_SYSTEM.md) | Shared design tokens, UI components and accessibility |
| 15 | [Localization & RTL](15_LOCALIZATION_AND_RTL.md) | Runtime locale dictionaries, direction and bidirectional text |
| 16 | [API & Integration Standards](16_API_AND_INTEGRATION_STANDARDS.md) | Provider adapters, webhooks and integration security |
| 17 | [AI & Automation Architecture](17_AI_AND_AUTOMATION_ARCHITECTURE.md) | Privacy-first planned AI capabilities and human approval |
| 18 | [Mobile & Offline Architecture](18_MOBILE_AND_OFFLINE_ARCHITECTURE.md) | PWA/offline target design and safe synchronization |
| 19 | [Testing & Quality Assurance](19_TESTING_AND_QUALITY_ASSURANCE.md) | Actual test toolchain, CI gates and coverage gaps |
| 20 | [Engineering Standards](20_ENGINEERING_STANDARDS.md) | TypeScript, source conventions, security and Git workflow |
| 21 | [Deployment, Monitoring & Disaster Recovery](21_DEPLOYMENT_MONITORING_AND_DISASTER_RECOVERY.md) | Environments, observability, backups and recovery targets |
| 22 | [Business Model & Sustainability](22_BUSINESS_MODEL_AND_SUSTAINABILITY.md) | Pilot funding, ethical sustainability and pricing hypotheses |
| 23 | [Implementation Roadmap](23_IMPLEMENTATION_ROADMAP.md) | Dependency-aware delivery and release gates |
| 24 | [Risk Register](24_RISK_REGISTER.md) | Product, security, technical and operational risks |
| 25 | [Architecture Decision Records](25_ARCHITECTURE_DECISION_RECORDS.md) | Accepted decisions and consequences |
| 26 | [Financial Accounting Specification](26_FINANCIAL_ACCOUNTING_SPECIFICATION.md) | Double-entry design and restricted-fund controls |
| 27 | [Institutional Support & Audit Protocol](27_INSTITUTIONAL_SUPPORT_AND_AUDIT_PROTOCOL.md) | Consent-based support access and background job security |
| 28 | [Public Website Islamic Design Specification](28_PUBLIC_WEBSITE_ISLAMIC_DESIGN_SPEC.md) | Public homepage design contract, content, localization and UX |

## Supplemental architecture, security and requirements references

| Document | Role |
|---|---|
| [Architecture Overview](ARCHITECTURE.md) | Short architecture overview; numbered document 06 is authoritative |
| [Database Schema Overview](DATABASE_SCHEMA.md) | Introductory schema notes; document 08 and current migrations are authoritative |
| [Domain Models Overview](DOMAIN_MODELS.md) | Domain summary; documents 07, 12 and 13 are authoritative |
| [MDI Requirements Overview](MDI_REQUIREMENTS.md) | Consolidated requirement summary; documents 02, 03 and 05 are authoritative |
| [November 2026 Security Audit](SECURITY_AUDIT_2026-11.md) | Dated source-review observations and remediation evidence boundaries |
| [Secure Manual Madrasa Admin Activation](30_SECURE_MANUAL_ADMIN_ACTIVATION.md) | AAL2-protected, email-independent Owner provisioning, one-time credentials and recovery runbook |

## Architecture implementation records

| Document | Role |
|---|---|
| [MDI Development Implementation Log](architecture/MDI_DEV_IMPLEMENTATION_LOG.md) | Historical development-environment snapshot; revalidate before action |
| [MDI Target Architecture](architecture/MDI_TARGET_ARCHITECTURE.md) | Accepted platform/tenant lifecycle architecture and release constraints |

## Operations

| Document | Role |
|---|---|
| [Global Owner Console Modernization](operations/GLOBAL_OWNER_CONSOLE_MODERNIZATION.md) | Dated UI modernization record and outstanding verification |
| [Global Owner Release Runbook](operations/MDI_GLOBAL_OWNER_RELEASE_RUNBOOK.md) | Dated release procedure and explicit production gates |
| [Resend Outbox Setup](operations/RESEND_OUTBOX_SETUP.md) | Server-side transactional email configuration; delivery remains unverified until tested |

## How to read status

- **Specification:** describes what should be built.
- **Source implemented:** corresponding code/migration exists.
- **Development verified:** a dated test or review confirms behavior in an isolated development environment.
- **Production verified:** runtime evidence confirms behavior in the intended production environment.
- **Historical snapshot:** accurate only for the date and environment stated in that record.

Do not treat a requirement, diagram, migration file, source implementation or green build as production verification. Avoid machine-local `file://` links; use repository-relative paths throughout.
