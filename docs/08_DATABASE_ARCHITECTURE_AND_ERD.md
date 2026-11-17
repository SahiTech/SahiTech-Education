# 08. Database Architecture & Entity Relationships

**Database platform:** Supabase-managed PostgreSQL  
**Migration source:** `packages/database/migrations`  
**Current documentation rule:** migration files are repository history, not proof of applied database state

## 1. Schema source of truth

The ordered SQL migrations are the schema change source of truth. The current manual-admin security branch contains migration files through `00052`. This is a repository/source statement only; it must not be confused with the migration ledger in any particular Development or Production database.

Before changing the schema:
1. Read the complete relevant migration history and current branch head.
2. Inspect the target environment's migration ledger and schema catalog.
3. Reconcile drift in tables, columns, constraints, triggers, indexes, grants, RLS policies, functions, views and Storage policies.
4. Add a new forward migration; do not rewrite a migration already applied to any shared environment.
5. Test on an isolated development database and prepare a rollback/forward-fix plan.
6. Obtain separate approval before production execution.

## 2. Conceptual entity groups

The database model spans:
- Platform identity and institutional tenancy: `tenants`, branches, profiles, tenant memberships, platform-owner/application/invitation objects.
- Academic structure: academic years, departments, classes, sections and subjects.
- Student lifecycle: students, admissions, guardians, enrollments and supporting documents.
- Academic operations: attendance, examinations, marks, result and Sanad records.
- Institutional operations: teachers, hostel rooms/allocations, staff leave and notices/pages.
- Finance: fee categories/invoices, accounts, journal entries and journal lines.
- Audit and integration: institutional/platform audit data, communication records and email outbox.

The exact table/column catalogue must be generated or reconciled against the environment being changed. Avoid fixed table counts in this specification.

## 3. Relational integrity

- Every tenant-owned record must carry or inherit a verified tenant boundary.
- Prefer tenant-aware composite foreign keys for relationships between tenant-owned records.
- Validate existing data before adding constraints; use staged validation where appropriate.
- Unique identifiers should be tenant-scoped where business rules permit.
- Financial journal lines must not reference accounts belonging to a different tenant.
- Student enrollment, guardian, class, academic year, examination and Sanad references must be checked for same-tenant integrity.
- Index child-side foreign-key columns based on query workload and explain plans.

## 4. Tenant security in the database

RLS is necessary but not sufficient. Review together:
- RLS enabled and FORCE RLS settings where appropriate;
- permissive/restrictive policy combination behavior;
- SELECT, INSERT, UPDATE, DELETE and table-level grants;
- view security/invoker behavior;
- function owner, SECURITY DEFINER/INVOKER and execution grants;
- safe search_path and schema privileges;
- Storage bucket visibility and object policies;
- privileged service-role usage and server authorization.

The recent migration sequence includes private-schema RLS helper implementations and public SECURITY INVOKER wrappers. The Owner lifecycle RPC surface is separately protected with database-level AAL2 checks; migration `00052` removes the unused legacy direct-tenant provisioning RPC and hardens invitation, document-review, application-status and final-activation RPCs. Confirm exact deployed definitions and grants before relying on source behavior.

## 5. Financial integrity

The domain package contains finance validation logic and the schema includes journal-related objects. Do not claim posted entries are immutable, balanced or transactionally posted unless database constraints/triggers/RPCs enforce those rules and integration tests verify bypass resistance.

Required production design:
- balanced debit/credit posting in one transaction;
- posted entries cannot be edited/deleted; corrections use reversal entries;
- unique and concurrency-safe document/receipt numbers;
- tenant-consistent account references;
- reliable audit events;
- restricted fund policy approved by qualified institutional/Shariah reviewers.

## 6. Database test coverage

`packages/database/tests/platform_security_smoke.sql` is a separate historical SQL test file; its table-count/header assumptions describe an older schema and it is not a current full-schema test. A targeted read-only regression script, `packages/database/tests/owner_rpc_aal2_security_smoke.sql`, verifies that the legacy direct-provision RPC is absent and all reviewed privileged Owner RPCs contain a database AAL2 guard. It was executed successfully against the isolated Development project on 2026-11-17. The repository database package's placeholder test script remains distinct from executing these SQL checks.

Run targeted SQL checks only against the intended isolated database and record exact environment/result. Never point destructive or fixture-creating tests at production.
