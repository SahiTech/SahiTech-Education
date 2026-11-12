# MDI System Architecture

**Madrasa Digitalization Initiative (MDI)**  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  

---

## 1. Architectural Philosophy: Domain-Driven Modular Monolith
MDI is structured as a **Domain-Driven Modular Monolith** inside a lightweight pnpm monorepo. This balances:
- **Rapid Development**: Shared types, single deployment pipeline, simplified developer experience.
- **Strict Boundary Enforcement**: Clear domain isolation between academic engines, finance, student life, and tenancy.
- **Enterprise Scalability**: Decoupled packages can later be extracted into independent microservices or Edge workers if load demands.

---

## 2. Monorepo Organization
```
SahiTech-Education/
├── apps/
│   └── web/                   # Next.js 15+ App Router, React 19, Tailwind CSS, Lucide
├── packages/
│   ├── database/              # Supabase DDL migrations, RLS policies, seeds, client types
│   └── domain/                # Core domain types, Qawmi & Alia engine rules, RBAC matrix
├── docs/                      # Architectural specifications and functional docs
├── AGENTS.md                  # Antigravity agent standard operating procedures
└── IMPLEMENTATION_STATUS.md   # Dynamic tracker of project implementation
```

---

## 3. Multi-Tenancy Architecture
MDI uses a **Hybrid Multi-Tenant Model**:
- **Shared Database, Isolated Schemas / Row Level Security**:
  - Every tenant (Madrasa) is assigned a unique `UUID` `tenant_id`.
  - Every operational table includes `tenant_id NOT NULL REFERENCES public.tenants(id)`.
  - PostgreSQL **Row Level Security (RLS)** is enforced on all tables.
  - Queries are filtered automatically at the database engine level via `auth.uid()` and `get_auth_tenant_ids()`.
- **Subdomain & Custom Domain Routing**:
  - Tenants can access the platform via `[subdomain].sahitech-edu.com` or custom domains.
  - The middleware resolves the hostname to the active `tenant_id`.

---

## 4. Academic Dual Engine Architecture
Madrasas in Bangladesh and South Asia primarily follow one of two academic models:
1. **Qawmi Academic Engine**:
   - Dars-e-Nizami curriculum structure.
   - Distinct Marhalas: *Ibtidaiyyah*, *Mutawassitah*, *Sanawiyyah Khassah*, *Fazilat*, *Takmil (Dawra-e-Hadith)*, *Ifta / Takhassus*.
   - Also supports *Hifzul Quran* (Para/Juz-based tracking) and *Nurani* (early childhood foundation).
   - Sanad (Certificate of completion) generation with classical chains of transmission.
   - Boarding / Lillah management (orphan and underprivileged student welfare fund).
2. **Alia Academic Engine**:
   - Bangladesh Madrasa Education Board (BMEB) curriculum.
   - Standard grade levels: *Ebtedayee (1-5)*, *Dakhil (6-10)*, *Alim (11-12)*, *Fazil (Bachelor)*, *Kamil (Master)*.
   - GPA (Grade Point Average: 1.0 to 5.0) system.
   - Formal board subject codes and national examination registration.

---

## 5. Security & RBAC Model
Access is governed by tenant-scoped roles:
- `super_admin`: Platform administrator across all tenants.
- `madrasa_admin` / `muhtamim` / `principal`: Full administrative rights within a tenant.
- `academic_dean` / `nazim_e_taleemat`: Manages classes, curriculums, examinations, and results.
- `teacher` / `ustad`: Enters attendance, marks, and student notes.
- `accountant`: Generates invoices, receives fee collections, and reconciles funds.
- `hostel_warden`: Oversees Darul Iqamah (hostel), meal counts, and boarding students.
- `student` / `talib_e_ilm`: Views timetable, syllabus, fees, and results.
- `parent` / `guardian`: Monitors attendance, payment history, and academic progress.

