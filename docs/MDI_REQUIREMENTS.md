# MDI Functional Requirements & Roadmap

**Madrasa Digitalization Initiative (MDI)**  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  

---

## 1. System Scope & Objectives
MDI empowers madrasas of all sizes to streamline:
1. **Institutional Governance**: Multi-branch administration, staff directories, role-based security.
2. **Academic Life**: Curriculum scheduling, Kitab distributions, class enrollments, syllabus progress.
3. **Student Information System (SIS)**: Admissions, biometric/daily attendance, residential boarding status.
4. **Financial Transparency**: Fee collection, invoice generation, discount waivers, Lillah / Zakat fund tracking.
5. **Sanad & Transcripts**: Automated generation of accredited certificates and transcripts in Arabic, Bengali, and English.

---

## 2. Localization Requirements
- Complete UI translations in Bangla, English, and Arabic.
- RTL (Right-to-Left) rendering for Arabic texts, reports, and Sanads.
- Dual calendar support: Hijri (Islamic lunar) and Gregorian.

---

## 3. Integration Requirements & Adapter Strategy
- **Database**: Supabase PostgreSQL 17 (Live connected via `supabase_mcp`).
- **Storage**: Supabase Storage for student photos, teacher credentials, and Madrasa logos.
- **SMS Gateway**: Local Bangladesh SMS gateway adapter (SSLWireless / Greenweb) with mock fallback for local dev.
- **Payment Gateway**: MFS adapter (bKash, Nagad, Rocket, SSLCommerz) with mock test sandbox for local dev.
- **Biometric Attendance**: API endpoint adapter for ZKTeco / fingerprint hardware webhooks.

