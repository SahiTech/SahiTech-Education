# SahiTech Education — Madrasa Digitalization Initiative (MDI)

**Parent brand:** SahiTech  
**Division:** SahiTech Education  
**Initiative:** Madrasa Digitalization Initiative (MDI)  
**Positioning:** SahiTech Education — An Education Initiative of SahiTech

MDI is a Bangladesh-first, international-ready digital platform initiative for Qawmi and Alia madrasas. The product direction is trilingual (Bangla, English and Arabic), with institution-scoped administration and separate academic models. Feature specifications describe intended capability; they do not by themselves establish that a feature is implemented or production-ready.

## Repository at a glance

- apps/web — Next.js App Router application (React, TypeScript, Tailwind CSS).
- packages/domain — portable TypeScript domain logic, academic rules, RBAC and finance validation.
- packages/database — Supabase client package and ordered SQL migrations.
- supabase/functions — Supabase Edge Functions.
- docs — product, design, architecture, security, operations and release specifications.
- AGENTS.md — coding-agent operating and documentation-sync rules.
- IMPLEMENTATION_STATUS.md — evidence-labelled implementation and release status.

This is a Domain-Driven Modular Monolith in a pnpm workspace. There is no separate UI workspace package in the currently inspected repository.

## Technology baseline

The checked-in manifests specify pnpm 12.18.0, Next.js 15.x, React 19, TypeScript 5.7.x, Supabase JS/SSR packages and Tailwind CSS 3.4.x. Use package manifests and lockfile as the authority for exact resolved versions; badges and prose must not override them.

The application has TypeScript locale dictionaries for bn, en and ar under apps/web/src/lib/i18n/dictionaries. Arabic direction is resolved as RTL. Verify locale completeness and direction in the UI; the presence of dictionaries alone is not a completeness test.

## Getting started

Prerequisites: Node.js 22 (the CI workflow currently uses Node 22) and pnpm 12.18.0.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Useful checks:

```bash
pnpm test
pnpm --filter web exec tsc --noEmit
pnpm --filter web lint
pnpm --filter web build
```

Note: packages/database currently exposes a placeholder test script. The separate SQL security smoke test must be run against an isolated database with the migration state it expects. A successful pnpm test command does not prove that SQL smoke test passed.

## Security and environment

- Copy the relevant example environment file locally and configure only the variables actually required by the code.
- Never commit .env files or disclose credentials.
- Supabase service-role credentials are server-only and must never use a NEXT_PUBLIC_ prefix.
- Tenant security depends on server authorization, RLS policies, table/function grants, Storage policies and tenant-aware relational constraints together.
- Development and production Supabase projects must remain separate.

## Documentation

Start with [the documentation index](docs/README.md), then read [the documentation sync policy](docs/DOCUMENTATION_SYNC_POLICY.md) and [agent instructions](AGENTS.md). Implementation status must be checked separately from target specifications. Production release always requires explicit approval and evidence for the release gates.
