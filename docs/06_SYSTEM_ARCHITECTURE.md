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
        Edge[Deployment Edge / HTTPS]
    end

    subgraph AppLayer[Next.js 15 App Router (apps/web) - Fullstack]
        ServerComp[React Server Components - SSR]
        ServerAction[Server Actions - Mutations]
        APIRoutes[Route Handlers - REST / Webhooks]
        MW[Middleware: Tenant Hostname & Auth Guard]
    end

    subgraph DomainLayer[Packages: Domain & Database]
        DomainPkg[@sahitech/domain: Pure TypeScript Business Logic]
        DatabasePkg[@sahitech/database: DDL Migrations, Typed Client]
    end

    subgraph DataLayer[Data & Infrastructure]
        Postgres[(Supabase PostgreSQL 17 - ap-south-1)]
        Storage[(Supabase Storage - S3 Compatible)]
        Auth[(Supabase Auth Engine)]
    end

    Browser --> Edge
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



## 3. Verified repository baseline versus optional target capabilities

The following are confirmed from the repository manifests inspected for this documentation revision:
- The web workspace is `apps/web`, with Next.js `^15.1.7` and React `^19.0.0`.
- The root package manager declaration is pnpm `12.18.0`.
- The active workspace packages include `@sahitech/domain` and `@sahitech/database`.
- The database integration uses Supabase SSR and Supabase JS packages.

Do not treat every technology shown in older diagrams or roadmap documents as deployed infrastructure. In particular, Cloudflare CDN/WAF, PWA service-worker/IndexedDB offline workflows, a separate shared UI workspace, and external worker infrastructure must be verified in code/configuration and the target environment before being described as implemented. They may remain valid future capabilities.

## 4. Runtime request and data flow

1. A browser requests a route in the Next.js web application.
2. Middleware/layout/server code establishes locale and authenticated session context as implemented by the current code.
3. Server Components read data and render UI; Server Actions/Route Handlers perform validated mutations or integration work.
4. Domain functions enforce framework-independent business invariants.
5. Database access uses the Supabase server/client boundary and PostgreSQL policies; authorization must be enforced server-side and by RLS, not by UI visibility alone.
6. Storage and external services are accessed only through authorized server-side paths and configured provider adapters.

The exact sequence and responsibilities must be updated when middleware, authentication, data-access or deployment topology changes. Never infer a security boundary from a diagram alone.

## 5. Architecture change rule

A material change to tenancy strategy, package boundaries, runtime topology, data access, hosting, queues, storage, or authentication requires:
- a reviewed ADR in [25 — Architecture Decision Records](./25_ARCHITECTURE_DECISION_RECORDS.md);
- updates to the directly affected architecture/security/deployment specifications;
- migration, compatibility and rollback notes where persisted data or production behavior is affected;
- tests that verify the new boundary.
