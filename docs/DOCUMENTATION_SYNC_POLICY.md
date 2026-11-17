# Documentation Sync Policy

**Applies to:** all code, schema, configuration, CI, UX and operational changes in MDI  
**Owner:** engineering contributor / coding agent  
**Required reading:** AGENTS.md

## 1. Rule

Documentation is a maintained engineering artefact, not a one-time project deliverable. Every meaningful code change must trigger a documentation impact review. Update the documents that describe the behavior that changed in the same branch and before the change is considered complete.

Do not update unrelated files merely to increase the number of touched documents. Do not leave affected documentation stale because a code change appears self-explanatory.

## 2. Evidence labels

Every implementation or release statement must be distinguishable as one of these:

| Label | Meaning | Minimum evidence |
|---|---|---|
| Target / Planned | Approved direction or requirement, not implemented | Product/specification decision |
| Source implemented | Behavior exists in the checked-in code or migration | Exact source path and current commit |
| Development verified | Behavior passed in an isolated development environment | Dated command, CI run, SQL result or browser test |
| Production verified | Behavior confirmed against the intended production runtime/data | Dated production evidence and authorized reviewer |
| Not verified | Evidence is missing, stale or inaccessible | State what evidence is required |

Never convert “source implemented” into “production verified” based only on a build, migration file, successful Vercel status, or a self-reported checklist.

## 3. Change-to-document map

| Change area | Documents to inspect and update |
|---|---|
| Homepage, public navigation, public-site copy, visual components | docs/28_PUBLIC_WEBSITE_ISLAMIC_DESIGN_SPEC.md, docs/14_FRONTEND_AND_DESIGN_SYSTEM.md, docs/15_LOCALIZATION_AND_RTL.md, docs/README.md when page structure changes |
| Dashboard, portal, shared components, responsive behavior, accessibility | docs/14_FRONTEND_AND_DESIGN_SYSTEM.md, docs/04_USER_PERSONAS_AND_JOURNEYS.md, docs/19_TESTING_AND_QUALITY_ASSURANCE.md |
| Locale dictionaries, locale persistence, metadata, RTL | docs/15_LOCALIZATION_AND_RTL.md, docs/14_FRONTEND_AND_DESIGN_SYSTEM.md, relevant feature specification |
| Domain types or academic rules | docs/07_DOMAIN_ARCHITECTURE.md, docs/12_QAWMI_ACADEMIC_SPECIFICATION.md, docs/13_ALIA_ACADEMIC_SPECIFICATION.md, docs/25_ARCHITECTURE_DECISION_RECORDS.md |
| SQL migration, table, constraint, index, RLS policy, grant, trigger, RPC or Storage policy | docs/08_DATABASE_ARCHITECTURE_AND_ERD.md, docs/09_MULTI_TENANCY_ARCHITECTURE.md, docs/10_AUTHENTICATION_AND_AUTHORIZATION.md, docs/11_SECURITY_AND_THREAT_MODEL.md, docs/DATABASE_SCHEMA.md, relevant feature spec, security audit and risk register |
| Global Owner, tenant lifecycle, onboarding, invitations, application review | docs/10_AUTHENTICATION_AND_AUTHORIZATION.md, docs/11_SECURITY_AND_THREAT_MODEL.md, docs/27_INSTITUTIONAL_SUPPORT_AND_AUDIT_PROTOCOL.md, relevant operations runbook |
| Finance, invoices, journals, Lillah/Zakat fund rules | docs/26_FINANCIAL_ACCOUNTING_SPECIFICATION.md, docs/07_DOMAIN_ARCHITECTURE.md, docs/08_DATABASE_ARCHITECTURE_AND_ERD.md, docs/11_SECURITY_AND_THREAT_MODEL.md |
| API, email, SMS, payment, file storage, webhooks, external provider | docs/16_API_AND_INTEGRATION_STANDARDS.md, docs/17_AI_AND_AUTOMATION_ARCHITECTURE.md where relevant, docs/21_DEPLOYMENT_MONITORING_AND_DISASTER_RECOVERY.md, provider runbook |
| PWA, offline cache, sync, conflict handling | docs/18_MOBILE_AND_OFFLINE_ARCHITECTURE.md, docs/19_TESTING_AND_QUALITY_ASSURANCE.md, security/privacy specification |
| Tests, lint, type checking, CI workflow | docs/19_TESTING_AND_QUALITY_ASSURANCE.md, docs/20_ENGINEERING_STANDARDS.md, README.md |
| Deployment, environment, monitoring, backup, recovery | docs/21_DEPLOYMENT_MONITORING_AND_DISASTER_RECOVERY.md, release runbook, IMPLEMENTATION_STATUS.md |
| Business scope, eligibility, pricing, roadmap or release risk | docs/02_PRODUCT_AND_BUSINESS_REQUIREMENTS.md, docs/22_BUSINESS_MODEL_AND_SUSTAINABILITY.md, docs/23_IMPLEMENTATION_ROADMAP.md, docs/24_RISK_REGISTER.md |
| Architectural decision or technology boundary | docs/06_SYSTEM_ARCHITECTURE.md, docs/25_ARCHITECTURE_DECISION_RECORDS.md, README.md, AGENTS.md |

## 4. Required agent workflow

1. **Inspect:** read the relevant source files, package manifests, SQL migrations, tests and current docs. Inspect the current branch and commit; do not rely on an old summary.
2. **Map:** identify every document that describes the changed behavior and any cross-document references affected.
3. **Implement:** make the code change with backward compatibility, security and data integrity in mind.
4. **Synchronize:** update the relevant MD files, diagrams, examples, route names, package names, migration references, environment variables, status labels and acceptance criteria.
5. **Verify:** run available checks. Validate Markdown links and Mermaid syntax where practical. Verify code examples against current source.
6. **Report:** list source changes, docs updated, tests actually run, checks not run, remaining gaps and approval gates.
7. **Commit:** include documentation in the same branch/PR. Use a docs-only commit only when no source behavior changed.

## 5. Source-of-truth hierarchy

When documents disagree, use this order and resolve the discrepancy instead of copying the contradiction:

1. Current checked-in implementation and ordered migration files (for source behavior).
2. Verified development or production evidence, with environment and date (for deployed state).
3. Accepted ADRs and current product decisions (for intended direction).
4. Numbered specification documents (for requirements and design intent).
5. Historical logs, changelogs and older architecture snapshots.

A historical runbook remains useful as an audit trail; do not silently rewrite dated facts as if they were current. Add a dated update or clearly label the snapshot.

## 6. Accuracy requirements

- Do not hard-code table counts, migration counts, route counts, bundle sizes, latency, uptime, pricing or adoption numbers unless the value is reproducibly sourced and dated.
- Do not claim that RLS alone guarantees security. Include grants, policies, function execution, table ownership, Storage and app authorization in the review.
- Do not claim an external integration is operational until a real end-to-end test confirms it.
- Do not describe a feature as live merely because a page, type, schema or placeholder exists.
- Do not call a curriculum, certificate or fund rule officially recognized without an authoritative confirmation.
- Never place credentials, personal student data, invitation tokens, or internal secrets in documentation.
- Prefer repository-relative Markdown links. Do not use local file:/// links.
- Keep diagrams synchronized with actual packages and runtime boundaries.
- For SQL examples, identify whether they are illustrative or copied from a current migration.

## 7. Completion checklist

- [ ] Relevant docs from the change map reviewed.
- [ ] Every affected document updated or explicitly judged unaffected.
- [ ] Planned vs implemented vs verified states accurately separated.
- [ ] Routes, packages, migrations, configuration and scripts checked against source.
- [ ] Links are repository-relative and resolve.
- [ ] Security, privacy, tenancy and data-retention implications documented.
- [ ] Tests and CI claims have actual evidence and date.
- [ ] CHANGELOG.md updated for meaningful changes.
- [ ] IMPLEMENTATION_STATUS.md updated only when evidence changes.
- [ ] ADR recorded for architectural decisions.
- [ ] docs/README.md updated for new, renamed or retired docs.
