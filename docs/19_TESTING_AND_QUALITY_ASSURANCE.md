# 19. Testing & Quality Assurance

**Purpose:** verify behavior at domain, application, database, browser and release boundaries.

## 1. Current repository test baseline

At the reviewed repository ref:
- `packages/domain` uses Node.js built-in `node --test` test files.
- The web CI workflow runs `pnpm test`, web TypeScript checking, web lint and Next.js build.
- `packages/database/package.json` currently defines its test script as an echo placeholder. It is not a database test.
- `packages/database/tests/platform_security_smoke.sql` is a separate SQL script. Its header records historical schema assumptions through migrations 00001–00030; it is not automatically run by the inspected CI workflow.
- No Playwright configuration or Vitest setup was confirmed in the reviewed tree. Do not report those tools as active until added and wired into CI.

This is a source inspection; no commands were executed as part of this documentation update.

## 2. Test pyramid

1. **Domain unit tests:** academic grading, admission state transitions, RBAC, finance invariants, token helpers and pure validation.
2. **Application/service tests:** server actions, authorization guards, idempotency, provider adapters and error handling.
3. **Database integration/security tests:** RLS, grants, function execution, tenant-aware foreign keys, triggers, transaction rollback and Storage policies against isolated PostgreSQL/Supabase.
4. **Browser E2E:** real user journeys across public application, owner MFA/review, invitation, onboarding, student operations, finance and Sanad verification.
5. **Operational tests:** email delivery, backups/restores, observability, deployment health and incident recovery.

## 3. Critical security test cases

- Tenant A cannot read/write Tenant B data using known or guessed IDs.
- Inactive memberships and pending/suspended tenants fail closed.
- A tenant user cannot grant themselves owner/platform authority.
- Global Owner requires trusted binding and required MFA.
- Public callers cannot access application/document metadata directly.
- Public Sanad lookup reveals only approved public fields.
- Storage upload/download obeys tenant ownership and allowed content rules.
- SECURITY DEFINER functions expose only intended operations to intended roles.
- Cross-tenant foreign-key insertion is rejected.
- Journal entries cannot be posted unbalanced, edited after posting or cross-link another tenant's account.
- Invitation/upload capabilities expire, revoke and cannot be replayed.
- Error paths roll back all writes and do not leak secrets.

## 4. CI baseline and recommended gates

The inspected workflow currently installs dependencies with a frozen lockfile, runs the root test script, checks web TypeScript, runs web lint and builds the web app. Keep workflow descriptions synchronized with the actual YAML.

Recommended future gates:
- test all workspace packages and build them where applicable;
- run real database integration tests against disposable Postgres/Supabase;
- lint/validate Markdown links and Mermaid blocks;
- add dictionary key-parity tests;
- add Playwright E2E across critical routes, bn/en/ar and RTL;
- add dependency/security scanning and secret scanning;
- publish test reports and pin tested commit SHA.

## 5. Release quality gates

A successful build proves compilation, not correct authorization, migration compatibility, live integration or production readiness. No release should proceed with unresolved critical/high security issues, unverified migrations, broken E2E workflows or missing backup/rollback plan.

Every test report must state command, commit, environment, timestamp, outcome and skipped checks. Never invent coverage percentages or passing test counts.
### Workspace authentication regression coverage

The web test suite includes source-level regression checks for:
- preventing arbitrary root-host labels from being interpreted as tenant subdomains;
- using the declared `tenant_users_tenant_id_fkey` relationship;
- selecting tenants only from the authenticated user's active membership;
- explicit selection for users with multiple memberships;
- clearing the selected-tenant cookie during logout;
- exposing workspace Logout on desktop, mobile navigation and Sidebar while preserving the separate Owner shell.

These tests protect code contracts. They do not replace an authenticated browser E2E test using a real disposable tenant identity.
