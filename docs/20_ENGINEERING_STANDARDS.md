# 20. Engineering Standards & Code Conventions

**Program**: Madrasa Digitalization Initiative (MDI)  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  

---

## 1. TypeScript Strictness Standards
- `strict: true` enabled across all `tsconfig.json` files.
- `noImplicitAny: true`: No un-typed variables or parameters permitted.
- `noUncheckedIndexedAccess: true`: Prevents accidental undefined access in array/dictionary lookups.
- Avoid `any` keyword; use `unknown` with type narrowing or Zod schemas.

---

## 2. Naming Conventions

| Target | Convention | Example |
| :--- | :--- | :--- |
| **Files & Folders** | `kebab-case` | `student-profile.tsx`, `qawmi-engine.ts` |
| **Components** | `PascalCase` | `StudentTable`, `Navbar`, `FeeInvoiceCard` |
| **Functions & Variables** | `camelCase` | `calculateQawmiGrade`, `getTenantById` |
| **Database Tables & Columns** | `snake_case` | `attendance_records`, `is_lillah_boarder` |
| **Domain Types & Interfaces**| `PascalCase` | `CurriculumType`, `QawmiMarhala` |
| **Database Enum Values** | `snake_case` | `'qawmi'`, `'alia'`, `'super_admin'` |

---

## 3. Git Workflow & Conventional Commits
All commits must follow the **Conventional Commits** specification:
- `feat(academic)`: New feature in the academic module.
- `fix(finance)`: Bug fix in fee invoice calculation.
- `docs(spec)`: Updates to project architecture documentation.
- `refactor(tenancy)`: Internal refactor without behavior changes.
- `test(rls)`: Adding or updating automated security tests.
- `chore(deps)`: Upgrading dependencies in `package.json`.

---

## 4. Security & Coding Rules of Engagement
1. **Never Disable RLS**: Disabling Row Level Security on any public table is strictly barred.
2. **Never Commit Secrets**: Hardcoded credentials, private keys, or `.env` secrets trigger immediate PR rejection.
3. **Always Validate Input**: All server inputs must be validated using Zod schemas before database execution.
4. **Trilingual Labels**: Never hardcode user-facing strings; all labels must reference translation keys.

