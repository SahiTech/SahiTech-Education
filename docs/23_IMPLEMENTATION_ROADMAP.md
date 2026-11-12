# 23. Phased Implementation Roadmap

**Program**: Madrasa Digitalization Initiative (MDI)  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  
**Strategy**: Dependency-Aware, Feature-Complete Vertical Deliveries  

---

## 1. Roadmap Overview (Phases 0 through 10)

```mermaid
gantt
    title MDI Engineering Roadmap Schedule
    dateFormat  YYYY-MM-DD
    section Phase 0 & 1
    Phase 0: Architecture & Documentation Foundation :done, p0, 2026-11-12, 1d
    Phase 1: Secure Core, Auth & Tenant Context       :active, p1, 2026-11-13, 4d
    section Phase 2 & 3
    Phase 2: Institution Setup & Onboarding Wizard   :p2, after p1, 4d
    Phase 3: Student SIS & Enrollment Registry       :p3, after p2, 5d
    section Phase 4 & 5
    Phase 4: Dual Academic Curriculum Engine         :p4, after p3, 5d
    Phase 5: Attendance & Examination Engine         :p5, after p4, 5d
    section Phase 6 & 7
    Phase 6: Double-Entry Fees & Lillah Funds        :p6, after p5, 5d
    Phase 7: CMS, Website & Comms Platform           :p7, after p6, 4d
    section Phase 8 to 10
    Phase 8: Hostel & Facility Operations            :p8, after p7, 4d
    Phase 9: Verifiable Sanads & Offline PWA         :p9, after p8, 5d
    Phase 10: Pilot Launch, Security Audit & Scaling :p10, after p9, 5d
```

---

## 2. Phase-by-Phase Deliverables

### Phase 0: Product & Architecture Foundation (COMPLETED)
- Master Blueprint approved by leadership.
- Complete documentation suite (01 to 25) established in `docs/`.
- Verified live PostgreSQL 17 database migration and clean Next.js build.

### Phase 1: Secure Platform Core & Tenancy (IMMEDIATE NEXT FOCUS)
- Supabase Auth integration (login, logout, session restoration).
- Next.js Middleware tenant context injector (`x-tenant-id`).
- Role-based route guard in `apps/web/src/app/(portals)/layout.tsx`.
- PostgreSQL write-policies for tenant users and profiles.

### Phase 2: Institution Management & Guided Setup
- Institution profile settings (Logo, Address, Contact, Registration).
- Multi-branch administration.
- 5-step visual onboarding wizard in natural Bengali.
- Academic year creation and switching.

### Phase 3: Student Information System (SIS)
- Digital admission application workflow.
- Full student profile management (Biographical, Residential, Lillah indicators).
- Class enrollment history and roll numbering.
- Validated Excel bulk student import/export engine.

### Phase 4: Teacher & Academic Dual-Engine
- Faculty registry with Sanad and board credentials.
- Class routine and weekly lecture workload scheduling.
- Qawmi Dars-e-Nizami Marhala and Kitab catalog management.
- Alia BMEB grade and subject code configurations.

### Phase 5: Attendance & Examination Engine
- Fast daily mobile attendance marking for Ustads.
- Multi-term exam scheduling (Chala & Semester).
- Subject marks entry ledger with automatic grace and fail logic.
- Immutable result snapshots and trilingual report cards (PDF).

### Phase 6: Finance & Shariah-Compliant Accounting
- Monthly fee invoice generation engine.
- Counterfoil cash receipt printing and bKash/Nagad MFS reconciliation.
- Double-entry general ledger with automated journal entries.
- Segregated Lillah and Zakat charity sub-ledgers.

### Phase 7: Institutional Website CMS & Communication
- Public-facing madrasa portal with noticeboard, about page, and faculty directory.
- Multilingual public notice publishing in Bangla, English, and Arabic.
- Pluggable SMS gateway adapter (SSLWireless / Greenweb) for urgent absentee alerts.

### Phase 8: Darul Iqamah (Hostel & Boarding) Management
- Dormitory room, floor, and bed allocations.
- Kitchen mess meal headcount calculator for daily cooking.
- Student leave and curfew gate-pass registry.

### Phase 9: Cryptographically Verifiable Sanads & Offline PWA
- Classical ceremonial Sanad certificates with SHA-256 digital verification hashes and QR codes.
- Public certificate verification portal at `verify.sahitech-edu.com`.
- PWA service worker with IndexedDB write buffering for offline attendance.

### Phase 10: Pilot Deployment & Operational Hardening
- Deployment of 3–5 pilot madrasas in Bangladesh.
- Penetration testing and automated cross-tenant security regression tests.
- Administrator and teacher training workshops.

