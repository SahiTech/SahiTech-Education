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

## 5. Development Commands
- `pnpm install`: Install dependencies.
- `pnpm dev`: Start development server.
- `pnpm build`: Production build.
- `pnpm test`: Execute automated test suites.
- `pnpm lint`: Lint codebase.

