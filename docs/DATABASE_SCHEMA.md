# MDI Database Schema — Supplemental Index

**Status:** Introductory summary only. Current migration files and [Database Architecture](08_DATABASE_ARCHITECTURE_AND_ERD.md) are authoritative.

MDI uses Supabase-managed PostgreSQL. Ordered schema changes live in `packages/database/migrations`. At the 2026-11-17 security feature branch head, repository migration files exist through 00052; this does not prove that the same migrations are applied to Development or Production. The Production ledger was separately observed at 00044 plus emergency 00051 and security hotfix 00052; feature migrations 00045–00050 remain pending.

## Conceptual areas
- Institution and tenant identity.
- Profiles and tenant memberships.
- Academic years, departments, classes, sections and subjects.
- Students, guardians, admissions and enrollments.
- Attendance, examinations, marks and Sanads.
- Teachers, hostel operations and notices.
- Fee, account, journal and audit records.
- Platform applications, invitations, owner lifecycle and email outbox.

The exact current schema, table count, indexes, constraints, policies and grants must be reconciled against the target environment. Do not use old hard-coded counts.

## Security reminder
RLS is one layer. Review table/schema grants, effective policies, function security/grants, views, Storage object policies, tenant-aware foreign keys and server authorization together. Migration 00052 retires the legacy owner_direct_provision_tenant function and adds database AAL2 checks to the remaining Owner lifecycle RPCs.

See:
- [Document 08 — Database Architecture](08_DATABASE_ARCHITECTURE_AND_ERD.md)
- [Document 09 — Multi-Tenancy](09_MULTI_TENANCY_ARCHITECTURE.md)
- [Document 11 — Security](11_SECURITY_AND_THREAT_MODEL.md)
- [Documentation Sync Policy](DOCUMENTATION_SYNC_POLICY.md)


## Teacher assignment table

`public.teacher_class_assignments` is the current-year access grant linking a teacher profile to a tenant-owned class and section, with an optional subject scope. See [Teacher Assignment Access Control](31_TEACHER_ASSIGNMENT_ACCESS_CONTROL.md) for its RLS and account-linking rules.
