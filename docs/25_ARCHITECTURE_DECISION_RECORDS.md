# 25. Architecture Decision Records (ADR)

**Program**: Madrasa Digitalization Initiative (MDI)  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  

---

## ADR-001: Selection of Shared Database with PostgreSQL 17 Row Level Security (RLS)
- **Status**: Approved (2026-11-12)
- **Context**: MDI requires absolute data isolation between educational institutions while maintaining cost viability for thousands of potential madrasas.
- **Decision**: Adopt a shared PostgreSQL 17 database where every table includes `tenant_id` and Row Level Security is enforced at the database engine level via security definer helper `public.get_auth_tenant_ids()`.
- **Consequences**: Optimal operational efficiency, low hosting overhead, streamlined migrations, and mathematically guaranteed tenant isolation at the database kernel.

---

## ADR-002: Next.js 15 App Router in a Domain-Driven Monorepo
- **Status**: Approved (2026-11-12)
- **Context**: Need a unified fullstack framework that supports server-side rendering (SSR), high performance on low-end devices, and trilingual SEO.
- **Decision**: Use Next.js 15 App Router within a pnpm monorepo containing decoupled packages: `@sahitech/domain` (pure business logic), `@sahitech/database` (DDL and client), and `@sahitech/ui`.
- **Consequences**: Shared TypeScript types, instant builds, fast page loads, and clear architectural boundaries preventing framework lock-in.

---

## ADR-003: First-Class Dual Academic Engines (Qawmi & Alia)
- **Status**: Approved (2026-11-12)
- **Context**: Educational institutions in Bangladesh follow either the independent Qawmi (Dars-e-Nizami) curriculum or the government-regulated Alia (BMEB) curriculum.
- **Decision**: Design both academic engines as first-class domain models from Day 1, with a hybrid mode for dual-wing madrasas.
- **Consequences**: Total pedagogical respect for both traditions without forcing either into an ill-fitting generic school model.

---

## ADR-004: Trilingual Localization with Full RTL Mirroring
- **Status**: Approved (2026-11-12)
- **Context**: The platform serves Bengali-speaking administrators, English-speaking international donors, and Arabic-speaking scholars and texts.
- **Decision**: Support Bangla (`bn` - primary default), English (`en`), and Arabic (`ar` with full bidirectional right-to-left layout mirroring via CSS logical properties) across all screens and reports.
- **Consequences**: True international-ready usability; Arabic layouts naturally mirror; zero string hardcoding in source code.

---

## ADR-005: Shariah-Compliant Double-Entry Accounting with Segregated Lillah Fund
- **Status**: Approved (2026-11-12)
- **Context**: Madrasas collect both commercial tuition fees and charitable religious donations (Zakat, Sadqah, Lillah boarding funds).
- **Decision**: Enforce double-entry bookkeeping with strict sub-ledger separation between operational revenues and restricted charity funds.
- **Consequences**: Total financial transparency, audit readiness for institutional Shoora committees, and strict compliance with Islamic charitable fund principles.

---

## ADR-006: Cryptographically Verifiable Sanads with QR Validation
- **Status**: Approved (2026-11-12)
- **Context**: Classical madrasa graduation certificates are often difficult to verify for visa or international academic purposes.
- **Decision**: Generate each Sanad with an immutable cryptographic SHA-256 hash and dynamic QR code pointing to public verification portal `verify.sahitech-edu.com`.
- **Consequences**: Tamper-proof academic credentials, enhanced institutional prestige, and seamless global transcript verification.

---

## ADR-007: Offline-First PWA Architecture for Classroom Operations
- **Status**: Approved (2026-11-12)
- **Context**: Teachers in rural brick-and-mortar campuses face intermittent cellular coverage.
- **Decision**: Implement a Progressive Web App (PWA) with service workers and IndexedDB write buffering for daily attendance and grade entry drafts.
- **Consequences**: 100% daily classroom uptime; zero lost attendance records; seamless automatic background synchronization upon network reconnection.

