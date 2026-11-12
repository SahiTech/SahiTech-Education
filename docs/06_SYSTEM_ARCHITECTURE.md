# 06. System Architecture & Topology

**Program**: Madrasa Digitalization Initiative (MDI)  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  

---

## 1. Architectural Style: Domain-Driven Modular Monolith

MDI is architected as a **Domain-Driven Modular Monolith** housed within a lightweight **pnpm monorepo**. This topology balances rapid velocity with clean architectural boundaries.

```mermaid
graph TD
    subgraph ClientLayer[Edge & Client Layer]
        Browser[Modern Browser / Mobile Device]
        PWA[PWA Service Worker & IndexedDB]
        Edge[Cloudflare CDN / WAF / SSL for SaaS]
    end

    subgraph AppLayer[Next.js 15 App Router - Fullstack]
        ServerComp[React Server Components - SSR]
        ServerAction[Server Actions - Mutations]
        APIRoutes[Route Handlers - REST / Webhooks]
        MW[Middleware: Tenant Hostname & Auth Guard]
    end

    subgraph DomainLayer[Packages: Domain & Database]
        DomainPkg[@sahitech/domain: Pure TypeScript Business Logic]
        DatabasePkg[@sahitech/database: DDL Migrations, Typed Client]
        UIPkg[@sahitech/ui: Design Tokens & Shared Components]
    end

    subgraph DataLayer[Data & Infrastructure]
        Postgres[(Supabase PostgreSQL 17 - ap-south-1)]
        Storage[(Supabase Storage - S3 Compatible)]
        Auth[(Supabase Auth Engine)]
    end

    Browser --> Edge
    PWA --> Edge
    Edge --> MW
    MW --> ServerComp
    MW --> ServerAction
    MW --> APIRoutes
    ServerComp --> DomainPkg
    ServerAction --> DomainPkg
    ServerAction --> DatabasePkg
    DatabasePkg --> Postgres
    DatabasePkg --> Storage
    ServerComp --> Auth
```

---

## 2. Monorepo Organization & Package Boundaries

```
sahitech-education/
├── apps/
│   └── web/                   # Next.js 15 App Router web application
│       ├── src/
│       │   ├── app/           # Routes: (public), (auth), (portals)
│       │   ├── components/    # UI components & design system tokens
│       │   ├── lib/           # Supabase SSR client/server utilities
│       │   └── messages/      # Trilingual i18n dictionaries (bn, en, ar)
│       └── package.json
│
├── packages/
│   ├── domain/                # Pure TypeScript domain models (zero framework deps)
│   │   ├── src/
│   │   │   ├── academic/      # Qawmi Dars-e-Nizami & Alia BMEB engines
│   │   │   ├── tenancy/       # Multi-tenant and branch entities
│   │   │   ├── rbac/          # Role-permission enforcement matrix
│   │   │   └── finance/       # Double-entry ledger & Lillah rules
│   │   └── package.json
│   │
│   └── database/              # DDL migrations, RLS policies, seeds & types
│       ├── migrations/        # SQL-first schema migrations
│       ├── src/               # Supabase typed database client
│       └── package.json
│
├── docs/                      # Master Engineering Documentation Suite
├── AGENTS.md                  # Antigravity agent standard operating guidelines
├── IMPLEMENTATION_STATUS.md   # Dynamic live implementation tracker
├── pnpm-workspace.yaml        # Monorepo workspace configuration
└── package.json               # Monorepo root scripts
```

### Dependency Rules:
1. `@sahitech/domain` must have **zero framework dependencies**. It contains pure TypeScript domain logic and can run in any JavaScript runtime (Node.js, browser, edge worker).
2. `apps/web` imports from `@sahitech/domain` and `@sahitech/database`. Circular dependencies are barred by workspace boundaries.
3. Database queries and mutations in `apps/web` run through React Server Components and Server Actions; secrets never reach the browser client.

