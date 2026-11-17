# 20. Engineering Standards & Code Conventions

## 1. General rules

- Follow TypeScript strictness configured by the repository's actual tsconfig files.
- Prefer explicit domain types, `unknown` with validation and narrow interfaces over unsafe `any`.
- Keep domain logic portable and free of Next.js/React/Supabase imports.
- Use server-side validation for all untrusted input.
- Preserve tenant boundaries and data integrity in every read and write path.
- Keep changes focused, testable, reversible and documented.

Do not claim a lint, commit-hook, formatter or runtime validation library is installed unless it appears in the manifests and active configuration.

## 2. Naming conventions

| Target | Convention | Example |
|---|---|---|
| Files/folders | Existing repository convention; prefer kebab-case for new modules | `student-profile.tsx` |
| React components | PascalCase | `StudentTable` |
| Functions/variables | camelCase | `calculateQawmiGrade` |
| Database objects | snake_case | `attendance_records` |
| Types/interfaces | PascalCase | `TenantContext` |
| Locale keys | Consistent nested semantic keys | `home.heroTitle` |

Do not rename existing public types, routes or database fields casually; plan compatibility when needed.

## 3. Validation and errors

- Validate all browser/server inputs at the server boundary.
- Confirm the current dependencies before choosing Zod or another schema library.
- Validate tenant ownership for every referenced ID.
- Normalize error responses and avoid leaking SQL, secrets or protected record existence.
- Propagate failures. Never report success when a critical downstream write failed.
- Use transactions or database RPCs for multi-row workflows requiring atomicity.

## 4. Database and security rules

- Treat SQL migrations as append-only after application to a shared environment.
- New migrations should be forward-only, idempotent where appropriate, reviewed and tested in isolated development first.
- Never disable RLS as a shortcut.
- Review policies, grants, views, function security mode/owner/search_path and Storage together.
- Enforce tenant consistency with database constraints wherever practical.
- Never place service-role credentials or any privileged secret in client bundles.
- Use cryptographically secure token generation; store hashes for bearer tokens.
- Never hard-code fallback passwords or return credentials from RPC responses.

## 5. Git and pull requests

Use clear Conventional Commit-style messages where practical:
- `feat(academic): ...`
- `fix(finance): ...`
- `docs(spec): ...`
- `refactor(tenancy): ...`
- `test(rls): ...`

Work on a feature branch and open a Pull Request. Describe motivation, scope, migrations, security/privacy implications, test evidence, docs updated and unresolved risks. Do not merge or deploy to production without explicit approval.

## 6. Documentation sync

Follow [Documentation Sync Policy](DOCUMENTATION_SYNC_POLICY.md) on every meaningful change. At minimum, identify affected docs before coding; update them in the same PR; keep status claims evidence-based; append a changelog note; and update ADRs when architecture changes.
