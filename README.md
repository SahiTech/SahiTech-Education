# SahiTech Education — Madrasa Digitalization Initiative (MDI)

[![Supabase Postgres 17](https://img.shields.io/badge/Postgres-17-316192?logo=postgresql&logoColor=white)](https://supabase.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![pnpm workspace](https://img.shields.io/badge/pnpm-12.18-f69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

**Parent Brand**: SahiTech  
**Division**: SahiTech Education  
**Active Project**: Madrasa Digitalization Initiative (MDI)  

---

## 🌟 Executive Overview
The **Madrasa Digitalization Initiative (MDI)** is an enterprise-grade, trilingual (Bangla, English, Arabic), hybrid multi-tenant academic and institutional operating system engineered specifically for Islamic educational institutions (Madrasas) in Bangladesh and South Asia.

MDI delivers native dual academic engines:
1. **Qawmi Academic Engine**: Tailored for Dars-e-Nizami (Befaqul Madaris / Al-Haiatul Ulya) marhala curricula, kitabs, chala examinations, sanad issuance, and lillah boarding funds.
2. **Alia Academic Engine**: Tailored for Bangladesh Madrasa Education Board (BMEB) curricula, Ebtedayee to Kamil, GPA grading, and national board metrics.

---

## 🏗️ Architecture & Technology Stack
- **Monorepo**: Domain-Driven Modular Monolith powered by pnpm workspaces.
- **Frontend / Application**: Next.js 15 App Router, React 19, Tailwind CSS, Lucide icons.
- **Backend / Database**: Supabase (PostgreSQL 17) with strict Row Level Security (RLS) on all multi-tenant tables.
- **Localization**: Bangla (`bn` - default), English (`en`), Arabic (`ar` with RTL layout support).
- **Security**: Tenant-scoped identity, role-based access control (RBAC), and session verification.

---

## 📂 Repository Layout
```
├── apps/
│   └── web/                   # Next.js 15 App Router application
├── packages/
│   ├── database/              # Supabase migrations (00001_initial_mdi_schema.sql) & client
│   └── domain/                # Pure TypeScript domain models (Qawmi & Alia engines, RBAC)
├── docs/                      # Technical specifications, architecture, and schema
├── AGENTS.md                  # Antigravity agent standard operating procedures
├── IMPLEMENTATION_STATUS.md   # Dynamic progress and connectivity tracker
├── package.json               # Monorepo root
└── pnpm-workspace.yaml        # Workspace configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v22+` or `v26+`
- pnpm `v12+`
- Supabase Project (configured in `.env.local`)

### 2. Installation & Running
```bash
# Install dependencies across all workspaces
pnpm install

# Start the web application
pnpm dev
```

---

## 🔒 Security & Tenant Isolation
All tables in the public schema enforce PostgreSQL Row Level Security (RLS) policies. Access is strictly scoped to the authenticated tenant membership through `get_auth_tenant_ids()`.
