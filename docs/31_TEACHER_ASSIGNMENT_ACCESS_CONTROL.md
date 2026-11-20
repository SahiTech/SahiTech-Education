# 31. Teacher Assignment Access Control

**Status:** Source implemented; Development catalog verification passed; authenticated browser E2E not yet run  
**Database migrations:** 00053–00057  
**Scope:** teacher identity linkage, class/section/subject assignments and least-privilege academic access

## 1. Access model

A tenant membership with role `teacher` is not, by itself, permission to read every student or academic record in that tenant. A teacher must have an active `teachers.user_id` link and one or more active `teacher_class_assignments` for the current academic year.

An assignment is scoped by:
- tenant;
- teacher profile;
- academic year;
- class;
- section;
- optional subject.

A NULL `subject_id` means the teacher is assigned to all subjects in that section. A subject-specific assignment grants only that subject. Tenant-aware composite foreign keys prevent mixing a teacher, section, class, subject or academic year from different tenants.

## 2. Account linking

The Madrasa Admin can link an existing Auth account to a teacher record only when:
- the teacher record is active;
- the teacher profile's stored email matches the Auth account email;
- the Auth email is confirmed;
- the teacher is not already linked to another user;
- the user is not linked to another teacher in the same tenant;
- the user has no conflicting tenant role.

The database RPC performs the teacher-profile and `tenant_users` membership change atomically. The web action looks up the existing Auth account through the server-only Auth Admin client. It does not create an account, set a password, or send an invitation email. A teacher without an existing verified account must complete the institution's approved account-creation process first.

## 3. Database enforcement

Migration 00053 adds `public.teacher_class_assignments`, tenant-aware foreign keys, active-assignment uniqueness, RLS and private SECURITY DEFINER predicates bound to `auth.uid()`.

Restrictive RLS policies narrow the pre-existing tenant-wide permissive policies for teachers on:
- students and active enrollments;
- classes, sections and subjects;
- attendance and exam marks;
- class routines.

Teachers are denied access to guardian identity/contact rows and Sanad issuance records unless they also hold an explicitly authorized administrative role. Admins and academic deans retain their existing administrative access. Assignment-management writes are limited to administrative roles by RLS.

Migrations 00054–00056 restore the least-privilege private-function EXECUTE baseline and add an atomic, verified-email teacher-account linking RPC. Migration 00057 removes anonymous SELECT grants from sensitive tenant tables while preserving the minimal public Sanad verification RPC.

## 4. Application workflow

The Teachers page is now restricted to users with `manage_tenant_settings`. Its assignment panel supports:
1. linking an existing verified login account to a teacher record;
2. assigning the teacher to a current-year class and section;
3. optionally limiting the assignment to one subject;
4. reviewing and removing active assignments.

The Faculty portal's existing student and attendance queries are automatically scoped by database RLS. Attendance and mark writes are also constrained at the database boundary, so bypassing the UI does not bypass assignment checks.

## 5. Verification evidence

**Development project:** `srcmodeinjvfqwkramni`  
**Migrations applied:** 00053, 00054, 00055, 00056 and 00057  
**SQL smoke test:** `packages/database/tests/teacher_assignment_access_smoke.sql` executed successfully on 2026-11-20.

The smoke test verifies:
- RLS enabled on the assignment table;
- restrictive teacher-scope policies exist on the targeted academic/student tables;
- the seven private teacher predicates are SECURITY DEFINER, use a fixed search_path and are executable by authenticated users but not anon;
- the teacher-link RPC is SECURITY DEFINER and authenticated-only;
- trigger-only private functions are not directly executable by authenticated users;
- anonymous reads are revoked from sensitive student, guardian, academic and Sanad tables;
- public Sanad verification remains available through its RPC.

This is a catalog/privilege smoke test, not a live two-teacher/two-section isolation test. No authenticated browser E2E or fixture-based cross-tenant test has been run yet.

## 6. Explicit release blockers and non-goals

- Production has not received migrations 00053–00057. No Production schema or data was changed by this work.
- Production still has direct anonymous SELECT grants on sensitive tables, including `sanads`, `students`, `student_guardians`, `attendance_records` and `exam_marks`. RLS currently narrows most tenant-scoped reads, but the issued-Sanad public policy makes direct table access especially important to remove. Apply and verify migration 00057 only through the approved Production release process.
- No Guardian/Parent portal or verified guardian-account linking/invitation workflow is implemented in this change. The existing `student_guardians` rows remain institution-managed records; they are not proof of a linked guardian identity.
- No live teacher login, account-link, assignment, attendance or exam-mark browser journey has been verified.
- A Vercel Preview marked READY for the parent feature branch predates this branch's commits. A new Preview and CI run are required for this branch before review or merge.

Do not label this feature Production-ready until the outstanding identity, browser, guardian and Production release gates are closed.
