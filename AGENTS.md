# AGENTS.md — Antigravity Agent Guidelines & MDI Engineering Standards

## 1. Project Mission & Identity
- **Parent Brand**: SahiTech
- **Division**: SahiTech Education
- **Initiative**: Madrasa Digitalization Initiative (MDI)
- **Primary Goal**: Deliver a modern, robust, trilingual (Bangla, English, Arabic), hybrid multi-tenant management and academic operating system for traditional and board-affiliated Madrasas across Bangladesh and South Asia.

---

## 2. Core Architecture
- **Paradigm**: Domain-Driven Modular Monolith inside a pnpm monorepo.
- **Frontend / Fullstack**: Next.js App Router (TypeScript, Tailwind CSS, Lucide icons, React).
- **Backend / Database**: Supabase (PostgreSQL 17, Row Level Security, Auth, Storage, Edge Functions).
- **Localization**: Bangla (`bn` - primary UI), English (`en`), Arabic (`ar` - RTL supported).
- **Academic Engines**:
  - **Qawmi Academic Engine**: Dars-e-Nizami / Befaqul Madaris curriculum, Marhala system (Ibtidaiyyah to Dawra-e-Hadith & Ifta), Kitab division, Sanad generation, Chala/Semester terms, Lillah boarding.
  - **Alia Academic Engine**: Bangladesh Madrasa Education Board (BMEB) curriculum, Ebtedayee to Kamil, GPA grading, board subjects.
- **Tenancy**: Hybrid Multi-Tenant model with tenant isolation guaranteed by PostgreSQL Row Level Security (RLS) on all tables with `tenant_id`.

---

## 3. Security & Engineering Rules
1. **Never Disable RLS**: Every public PostgreSQL table must have Row Level Security enabled and verified with appropriate tenant-isolation policies.
2. **Never Hardcode Secrets**: Always use environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. **No Unsanctioned Breaking Changes**: Maintain backward compatibility in database migrations.
4. **Trilingual First**: All UI labels, academic designations, and reports should support Bangla, English, and Arabic.
5. **Sandboxed Development**: Respect the sandbox execution rules; run package installations outside sandbox when required per tool guidelines, and run builds/tests in the sandbox.

---

## 4. Workspaces & Package Structure
- `apps/web`: Next.js web application, localized layouts, tenant portal, and dashboards.
- `packages/domain`: Pure TypeScript business logic, Qawmi & Alia curriculum engines, RBAC policies, and domain types.
- `packages/database`: Supabase migrations, DDL, seed data, and generated database types.

---

## 5. Mandatory Documentation Synchronization (Non-Optional)

Documentation is part of the implementation. A code change is not complete until its relevant documentation has been reviewed and synchronized in the same change set.

### Required agent workflow
1. **Discover before editing:** inspect the current repository tree, the relevant source files, existing tests, migrations, configuration, and the linked documents in `docs/README.md`. Do not rely on old chat summaries or stale status claims.
2. **Map change to documentation:** use the ownership map in `docs/DOCUMENTATION_GOVERNANCE.md`. Read every directly affected specification before changing code.
3. **Implement and verify:** make the smallest safe code change; add/update tests; run the relevant checks. Never claim a check passed unless it was actually executed and its output inspected.
4. **Synchronize docs in the same branch/PR:** update all affected specifications, diagrams, examples, route lists, environment-variable references, migration notes, operational runbooks, and acceptance criteria. Update `CHANGELOG.md` for user-visible or operationally meaningful changes and `IMPLEMENTATION_STATUS.md` only with freshly verified facts.
5. **Record evidence:** state what changed, files affected, commands run, results, limitations, and any required human decision. Distinguish implemented, tested, deployed, and production-verified states.
6. **Review drift:** search for stale names, removed routes, old versions, outdated counts, broken links, local-machine paths, and contradictory claims before finishing.

### Documentation quality rules
- Use repository-relative Markdown links; never commit `file:///`, local drive paths, machine-specific paths, or private workspace paths.
- Do not invent features, integrations, metrics, compliance, uptime, test results, or deployment state.
- Mark roadmap/target architecture separately from current implementation.
- Every new module, route, permission, table, migration, environment variable, integration, background job, or security boundary must have an identified documentation owner.
- Preserve backward-compatible migration history. Never rewrite an applied migration to make docs appear consistent.
- Keep secrets, tokens, personal data, and real production credentials out of documentation and examples.
- If a change has no documentation impact, record the reason in the PR/change summary.
- Do not silently change approved business rules, academic policy, accounting rules, legal claims, or production infrastructure.

### Completion checklist
- [ ] Relevant specification(s) read before implementation.
- [ ] Code, tests, and documentation updated together.
- [ ] Docs index and internal links verified.
- [ ] Current-state claims backed by repository/test/deployment evidence.
- [ ] No unrelated documentation rewrite or unsupported claim.
- [ ] Final summary includes code/docs paths and actual verification results.

## 6. Development Commands
- `pnpm install`: Install dependencies.
- `pnpm dev`: Start development server.
- `pnpm build`: Production build.
- `pnpm test`: Execute automated test suites.
- `pnpm lint`: Lint codebase.

