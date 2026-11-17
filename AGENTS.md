# AGENTS.md — MDI Engineering & Documentation Rules

## 1. Product identity
- Parent brand: SahiTech.
- Division: SahiTech Education.
- Initiative: Madrasa Digitalization Initiative (MDI).
- Positioning: “SahiTech Education — An Education Initiative of SahiTech”.
- Do not imply that SahiTech Education or MDI is a separately registered legal entity.
- Bangladesh is the primary market; international readiness is a design objective, not proof of current availability.

## 2. Repository facts (verify before changing)
- pnpm workspace monorepo.
- Web application: apps/web (Next.js App Router, React, TypeScript, Tailwind CSS).
- Domain package: packages/domain (pure TypeScript business rules).
- Database package: packages/database (Supabase client/types and SQL migrations).
- Supabase Edge Function(s): supabase/functions.
- The repository currently does not contain a separate @sahitech/ui workspace package. Do not document or import one unless it is actually added.
- i18n dictionaries are TypeScript modules under apps/web/src/lib/i18n/dictionaries. Check the current source before assuming JSON files are authoritative.
- SQL migrations are append-only and ordered. Do not edit an already-applied migration to change deployed behavior.

## 3. Architecture and security invariants
1. Preserve the Domain-Driven Modular Monolith. Do not introduce microservices, Redis, Kubernetes, or a new paid provider without a measured need and explicit approval.
2. All tenant authorization must be enforced server-side and at the database boundary. A client-supplied tenant ID is never an authorization source.
3. Never disable RLS to make a feature work. Verify table privileges, policies, views, RPC grants, Storage policies, and function ownership together.
4. Never expose SUPABASE_SERVICE_ROLE_KEY, database credentials, Resend keys, cron secrets, HMAC secrets, or other privileged secrets to the browser or a NEXT_PUBLIC_ variable.
5. SECURITY DEFINER routines require a minimal safe search_path, narrow grants, explicit authorization, and review of every callable role. Prefer private-schema implementations with narrowly scoped invoker wrappers when appropriate.
6. Tenant lifecycle, Global Platform Owner, and tenant RBAC are separate authorization concerns. The Global Platform Owner is not a tenant role.
7. Financial posting, academic result ratification, Sanad issuance, and privileged lifecycle changes need server-side validation, transaction boundaries, audit events, and regression tests.
8. Do not assert that the database enforces a business invariant unless a database constraint/trigger/RPC and a test prove it. A TypeScript validator alone is not a database guarantee.
9. AI or automation must not autonomously mutate critical academic, financial, identity, or tenant lifecycle data.
10. Treat external email, payment, SMS, storage, calendar and AI services as unavailable until credentials, configuration, and end-to-end delivery are verified.

## 4. Documentation is part of the change
**A code change is not complete until its affected documentation has been reviewed and synchronized.**

Before implementation:
- Read docs/DOCUMENTATION_SYNC_POLICY.md and the relevant specification(s).
- Inspect the actual implementation and current migration history; do not treat an old status report as live truth.
- Identify all affected docs using the change-to-document map.

Before commit / PR:
- Update relevant technical specs, architecture, security, operations, and user-facing documentation.
- Update IMPLEMENTATION_STATUS.md only with facts supported by the current code, CI output, database evidence, or runtime evidence. Label the evidence source and date.
- Add a concise CHANGELOG.md entry for meaningful changes.
- Update docs/README.md for new, renamed, or retired documents.
- Add or update an ADR when an architectural decision changes.
- Label planned, source-implemented, development-verified, and production-verified states separately.
- Remove stale file:// links, old route names, obsolete package names, hard-coded counts and unsupported “live/secure/production-ready” claims.
- Never replace an evidence gap with an assumption. Write “not verified” and specify what evidence is needed.

The sync checklist is mandatory:
[ ] Code paths and actual behavior inspected
[ ] Relevant MD files updated
[ ] Cross-document links and names checked
[ ] Tests/checks actually run and results recorded accurately
[ ] CHANGELOG and implementation status updated where applicable
[ ] Production/paid/destructive actions kept behind explicit approval

## 5. Safe operating boundaries
- Work on a feature branch and deliver through a Pull Request; do not push directly to main.
- Do not change production database data/schema, production Auth settings, production secrets, DNS, paid services, or production deployment without separate explicit approval.
- Do not reset owner accounts/MFA, issue real invitations, approve real applications, or activate tenants during tests.
- Use isolated development/test data and rollback-only tests for database integration.
- Never commit real credentials or customer/student personal information.

## 6. Development and verification
Use the commands actually present in package manifests. Current useful checks include:
- pnpm install --frozen-lockfile
- pnpm test
- pnpm --filter web exec tsc --noEmit
- pnpm --filter web lint
- pnpm --filter web build

The database package test script is currently a placeholder echo; it is not a substitute for executing packages/database/tests/platform_security_smoke.sql against an isolated database. Do not claim SQL security tests ran unless their execution evidence is available.

## 7. Delivery standard
Prefer complete vertical changes with tests and documentation over broad speculative rewrites. Preserve existing data and API compatibility. Explain unresolved risks and release gates in the PR. A green build is not proof of production readiness.
