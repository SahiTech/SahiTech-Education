# Changelog

All notable changes to the Madrasa Digitalization Initiative (MDI) platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-12

### Added
- **Complete MDI Institutional SaaS Platform Ecosystem (Phases 3 through 10)**:
  - **Database Migration 00004 & 00005**:
    - Created 16 additional tables bringing database total to **32 public tables with 100% Row Level Security (RLS)**.
    - Added tables: `student_admissions`, `student_guardians`, `hostel_rooms`, `hostel_allocations`, `lillah_evaluations`, `exams`, `exam_marks`, `sanads`, `staff_leaves`, `class_routines`, `accounts`, `journal_entries`, `journal_entry_lines`, `tenant_notices`, `tenant_pages`, `communication_logs`.
    - Implemented Security Definer RPC function `public.verify_sanad_public(p_token)` for tamper-proof credentials verification.
  - **Domain Engine Enhancements (`@sahitech/domain`)**:
    - Added Document 26 Shariah Fund Segregation validator preventing cross-fund commingling.
    - Added balanced double-entry accounting validator (`validateJournalEntry`).
    - Added Befaqul Madaris canonical Qawmi Dharja grading scale (`calculateQawmiDharja`).
    - Added portable bitwise cryptographic Sanad verification hash generator (`generateSanadVerificationHash`).
    - Added Shariah Lillah eligibility assessment calculator (`evaluateLillahEligibility`).
    - Added admission workflow progression state machine (`canTransitionAdmission`).
    - All 24 unit and security tests passing.
  - **Server Actions Suite**:
    - `admissions.ts`: Online admissions, scoring, and atomic student enrollment.
    - `hostel.ts`: Hostel room inventory and bed allocations.
    - `lillah.ts`: Shariah Lillah Boarding assessments and subsidy approvals.
    - `exams.ts`: Chala exam creation, marks entry, and result publication.
    - `sanad.ts`: Cryptographic Sanad issuance and public verification.
    - `finance.ts`: Chart of Accounts seeding, double-entry vouchers, and cash receipts.
    - `teachers.ts`: Staff registration and leave approval workflow.
    - `attendance.ts`: Batch attendance recording and live metric updates.
    - `cms.ts`: Public notice creation and publication.
    - `reports.ts`: Executive overview reports and Befaqul Madaris board returns.
  - **Fullstack User Interface (24 Production Routes)**:
    - `/dashboard/admissions`: Admissions tracker with exam evaluation modal.
    - `/dashboard/academic/exams`: Chala examinations, mark entry sheets, and publication controls.
    - `/dashboard/academic/sanad`: Digital Sanad issuance, registry, and printable certificates.
    - `/dashboard/hostel`: Darul Iqamah hostel room inventory and bed vacancy tracker.
    - `/dashboard/lillah`: Lillah Boarding and Zakat welfare grant assessment workspace.
    - `/dashboard/teachers`: Staff service directory and leave approval desk.
    - `/dashboard/attendance`: Daily attendance sheet, bulk mark-all, and live attendance metrics.
    - `/dashboard/finance`: Double-entry Chart of Accounts, journal vouchers, and cash counter receipts.
    - `/dashboard/reports`: Executive Muhtamim KPIs and Befaqul Madaris board return tables.
    - `/dashboard/settings`: Institutional profile, board affiliation, and zero-trust security guarantees.
    - `/public-site`: Public institutional web portal with notice board and online admission inquiry form.
    - `/verify` & `/verify/[hash]`: Official digital certificate verification lookup and sheet with QR verification token.
  - **Verification**:
    - `pnpm test` ➔ 24/24 passing.
    - `pnpm --filter web lint` ➔ 0 warnings, 0 errors.
    - `pnpm --filter web build` ➔ 24 routes successfully compiled.

## [0.3.0] - 2026-11-12

### Added
- **Phase 2 Institution Setup & Onboarding Wizard**:
  - Applied Database Migration `00003_institution_onboarding_wizard.sql` extending `public.tenants` with `onboarding_step`, `is_verified`, `onboarding_completed_at`, `board_affiliation`, `motto_bn`, `motto_en`, `established_year`, and `program_policies`.
  - Implemented 6-step Onboarding Server Action suite in `apps/web/src/app/actions/onboarding.ts`:
    - `saveOnboardingStep1`: Institutional Profile & Program Policies.
    - `saveOnboardingStep2`: Campuses & Branches Setup.
    - `saveOnboardingStep3`: Academic Year & Calendar Initialization.
    - `saveOnboardingStep4`: Departments & Canonical Marhala Seeding.
    - `saveOnboardingStep5`: Leadership & Staff Role Designation.
    - `finalizeOnboarding`: Institutional Eligibility Verification, completion audit trail, and launch.
    - `getOnboardingState`: Multi-table draft state retrieval.
  - Built interactive multi-step Onboarding Wizard UI (`/onboarding`) with progress indicators, forward/backward navigation, step validation, and mobile support.
  - Added dynamic setup alert banner to Main Dashboard (`/dashboard`) directing administrators to incomplete onboarding.
  - Added unit test suite in `packages/domain/test/onboarding.test.mjs` verifying multi-step validation and completeness gates (17 total tests passing).

## [0.2.0] - 2026-11-12

### Added
- **Phase 1 Platform Core & Tenant Isolation**:
  - Implemented Next.js middleware with Supabase SSR session validation and subdomain-based multi-tenant resolution (`x-tenant-subdomain`).
  - Added server-side tenant context resolver (`getActiveTenantContext`, `requirePermission`) enforcing role permissions across tenant boundaries.
  - Implemented append-only audit logging engine (`logAuditEvent`) writing to `public.audit_logs`.
  - Added Server Actions for authentication (`signInWithEmail`, `signOutUser`), institutional provisioning (`provisionInstitution`), and student admission (`createStudent`).
  - Created dynamic Madrasa Administrative Dashboard connected to live PostgreSQL 17 tables with real-time KPI metrics and tenant isolation.
  - Implemented Live Student Information System (SIS) directory with multi-field search and residential filtering.
  - Built Student Admission Wizard (`/dashboard/students/new`) supporting trilingual data entry, residential status, and Shariah Lillah Boarding fund tags.
  - Developed 4 specialized role-based portals with cryptographic permission guards:
    - `/portals/admin`: Muhtamim Institutional Administration & Audit Trail.
    - `/portals/academic`: Nazim-e-Taleemat Curriculum, Marhalas, and Canonical Kitab allocations.
    - `/portals/faculty`: Asatiza Daily Attendance Register and Roll Sheet.
    - `/portals/bursar`: Cash Counter & Document 26 Shariah Fund Segregation (General vs. Lillah & Zakat Funds).
  - Added automated test suite in `packages/domain` verifying RBAC boundaries and academic calculations with Node.js built-in test runner (8/8 tests passing).

- **Database Migration 00002**:
  - Created `public.audit_logs` table with RLS.
  - Added `has_tenant_role()` security definer function.
  - Added automatic profile creation trigger on `auth.users`.
  - Defined granular INSERT/UPDATE/DELETE mutation policies for all 15 public tables.

## [0.1.0] - 2026-11-12

### Added
- **Phase 0 Architecture & Engineering Baseline**:
  - Authored Master Vision Blueprint (`MDI_MASTER_BLUEPRINT.md`).
  - Completed comprehensive 27-document specification suite in `docs/` covering all aspects of MDI architecture, security, multi-tenancy, curricula, and operations.
  - Established initial database schema with 15 public tables, 30 foreign keys, 29 btree indexes, and zero-trust RLS policies.
  - Created pnpm monorepo architecture with `@sahitech/domain`, `@sahitech/database`, and `apps/web`.

