-- Migration: 00004_complete_mdi_ecosystem.sql
-- Description: Complete MDI institutional database ecosystem covering Admissions, Darul Iqamah (Hostel),
-- Shariah Lillah Evaluation, Examinations, Digital Sanads, Jadwal Routines, Staff Leaves,
-- Double-Entry Accounting Engine (Doc 26), Public CMS, and Communication Logs.

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE admission_status AS ENUM (
        'inquiry', 'applied', 'exam_scheduled', 'passed', 'rejected', 'enrolled', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE qawmi_dharja AS ENUM (
        'mumtaz', 'jayyid_jiddan', 'jayyid', 'maqbool', 'rasib'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE account_category AS ENUM (
        'asset', 'liability', 'equity', 'revenue', 'expense'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE fund_classification AS ENUM (
        'general_fund', 'lillah_zakat_fund', 'waqf_restricted_fund', 'building_fund'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM (
        'pending', 'approved', 'rejected', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE sanad_status AS ENUM (
        'draft', 'issued', 'verified', 'revoked'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- 2. ADMISSIONS & GUARDIAN MANAGEMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    application_no VARCHAR(100) NOT NULL,
    target_academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    target_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    full_name_bn VARCHAR(255) NOT NULL,
    full_name_en VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20) DEFAULT 'male',
    blood_group VARCHAR(10),
    father_name_bn VARCHAR(255),
    mother_name_bn VARCHAR(255),
    guardian_phone VARCHAR(50) NOT NULL,
    guardian_email VARCHAR(255),
    present_address TEXT,
    permanent_address TEXT,
    previous_madrasa TEXT,
    is_residential_applicant BOOLEAN NOT NULL DEFAULT false,
    is_lillah_applicant BOOLEAN NOT NULL DEFAULT false,
    written_exam_marks NUMERIC(5, 2),
    oral_exam_marks NUMERIC(5, 2),
    interview_remarks TEXT,
    status admission_status NOT NULL DEFAULT 'applied',
    enrolled_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, application_no)
);

CREATE TABLE IF NOT EXISTS public.student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    relation_type VARCHAR(100) NOT NULL, -- Father, Mother, Brother, Uncle, Shariah Mehram
    nid_number VARCHAR(100),
    occupation VARCHAR(150),
    phone VARCHAR(50) NOT NULL,
    emergency_phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    is_primary_contact BOOLEAN NOT NULL DEFAULT true,
    is_financial_sponsor BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 3. DARUL IQAMAH (HOSTEL) & SHARIAH LILLAH EVALUATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hostel_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    building_name VARCHAR(150) NOT NULL,
    floor_number VARCHAR(50) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    room_type VARCHAR(100) DEFAULT 'general', -- general, hifz_dorm, dawra_hall
    total_beds INT NOT NULL DEFAULT 6,
    warden_name VARCHAR(150),
    warden_phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, building_name, room_number)
);

CREATE TABLE IF NOT EXISTS public.hostel_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.hostel_rooms(id) ON DELETE CASCADE,
    bed_number VARCHAR(50) NOT NULL,
    allocation_start DATE NOT NULL DEFAULT CURRENT_DATE,
    allocation_end DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, bed_number, is_active)
);

CREATE TABLE IF NOT EXISTS public.lillah_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    evaluator_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    family_monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    number_of_siblings INT NOT NULL DEFAULT 1,
    is_orphan BOOLEAN NOT NULL DEFAULT false,
    father_occupation VARCHAR(150),
    local_recommender_name VARCHAR(255),
    local_recommender_phone VARCHAR(50),
    shariah_eligibility_status VARCHAR(50) NOT NULL DEFAULT 'verified_mustahiq', -- verified_mustahiq, conditional, ineligible
    subsidy_percentage INT NOT NULL DEFAULT 100, -- 100% full lillah, 50% partial
    approved_monthly_stipend NUMERIC(12, 2) DEFAULT 0.00,
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 4. EXAMINATIONS, TABULATION & DIGITAL SANADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    term_code VARCHAR(50) NOT NULL, -- chala_1, chala_2, chala_3, annual, test
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, academic_year_id, term_code)
);

CREATE TABLE IF NOT EXISTS public.exam_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_marks INT NOT NULL DEFAULT 100,
    passing_marks INT NOT NULL DEFAULT 33,
    gpa NUMERIC(3, 2),
    dharja qawmi_dharja,
    is_absent BOOLEAN NOT NULL DEFAULT false,
    evaluator_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, exam_id, student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS public.sanads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    sanad_serial_no VARCHAR(100) NOT NULL,
    title_bn VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    marhala_name_ar VARCHAR(255),
    result_dharja qawmi_dharja,
    gpa NUMERIC(3, 2),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    verification_hash VARCHAR(64) NOT NULL UNIQUE,
    status sanad_status NOT NULL DEFAULT 'issued',
    signatory_muhtamim VARCHAR(255),
    signatory_dean VARCHAR(255),
    pdf_storage_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, sanad_serial_no)
);

-- ============================================================================
-- 5. STAFF SERVICE BOOKS, LEAVES & JADWAL MATRIX
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staff_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL DEFAULT 'casual', -- casual, medical, hajj, ramadan
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT NOT NULL DEFAULT 1,
    reason TEXT,
    status leave_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.class_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL, -- saturday, sunday, monday, tuesday, wednesday, thursday
    period_number INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, class_id, section_id, day_of_week, period_number)
);

-- ============================================================================
-- 6. DOUBLE-ENTRY ACCOUNTING & SHARIAH FUND SEGREGATION (DOC 26)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- e.g. 1001 Cash, 1002 Bank, 4001 Admission Fees, 2001 Zakat Fund
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category account_category NOT NULL,
    fund_type fund_classification NOT NULL DEFAULT 'general_fund',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    entry_number VARCHAR(100) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fund_type fund_classification NOT NULL DEFAULT 'general_fund',
    narration TEXT NOT NULL,
    is_posted BOOLEAN NOT NULL DEFAULT true,
    posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, entry_number)
);

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    debit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_debit_credit_positive CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT check_debit_or_credit CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

-- ============================================================================
-- 7. INSTITUTIONAL WEBSITE, CMS & NOTICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title_bn VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    content_bn TEXT NOT NULL,
    content_en TEXT,
    category VARCHAR(100) DEFAULT 'general', -- academic, exam, holiday, admission, urgent
    attachment_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.tenant_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL, -- about-us, history, dars-e-nizami, contact
    title_bn VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    content_html TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS public.communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(50),
    recipient_email VARCHAR(255),
    message_type VARCHAR(50) NOT NULL, -- sms, email, push
    template_code VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- queued, sent, failed, delivered
    provider_reference VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) FOR ALL NEW TABLES
-- ============================================================================
ALTER TABLE public.student_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lillah_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. TENANT ISOLATION POLICIES (SELECT & MUTATION)
-- ============================================================================

-- Admissions
CREATE POLICY "Admissions viewable by tenant members"
ON public.student_admissions FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Admins and deans can manage admissions"
ON public.student_admissions FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));

-- Guardians
CREATE POLICY "Guardians viewable by tenant members"
ON public.student_guardians FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Admins and deans can manage guardians"
ON public.student_guardians FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));

-- Hostel Rooms & Allocations
CREATE POLICY "Hostel rooms viewable by tenant members"
ON public.hostel_rooms FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Warden and admins can manage hostel rooms"
ON public.hostel_rooms FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'hostel_warden'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'hostel_warden'::user_role]));

CREATE POLICY "Hostel allocations viewable by tenant members"
ON public.hostel_allocations FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Warden and admins can manage hostel allocations"
ON public.hostel_allocations FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'hostel_warden'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'hostel_warden'::user_role]));

-- Lillah Evaluations
CREATE POLICY "Lillah evaluations viewable by authorized admins"
ON public.lillah_evaluations FOR SELECT
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role, 'academic_dean'::user_role]));

CREATE POLICY "Admins can manage lillah evaluations"
ON public.lillah_evaluations FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]));

-- Exams & Marks
CREATE POLICY "Exams viewable by tenant members"
ON public.exams FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Academic admins can manage exams"
ON public.exams FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));

CREATE POLICY "Exam marks viewable by tenant members"
ON public.exam_marks FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Teachers and academic staff can manage marks"
ON public.exam_marks FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role, 'teacher'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role, 'teacher'::user_role]));

-- Sanads (Publicly verifiable via verification_hash or by tenant members)
CREATE POLICY "Sanads viewable by tenant members or public verified"
ON public.sanads FOR SELECT
USING (
    (tenant_id IN (SELECT public.get_auth_tenant_ids()))
    OR (status = 'issued')
);

CREATE POLICY "Admins and deans can manage sanads"
ON public.sanads FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));

-- Staff Leaves & Jadwal Routines
CREATE POLICY "Leaves viewable by tenant members"
ON public.staff_leaves FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Teachers can submit leaves and admins approve"
ON public.staff_leaves FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'teacher'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'teacher'::user_role]));

CREATE POLICY "Routines viewable by tenant members"
ON public.class_routines FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Academic admins can manage routines"
ON public.class_routines FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));

-- Double-Entry Accounting
CREATE POLICY "Accounts viewable by bursars and admins"
ON public.accounts FOR SELECT
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]));

CREATE POLICY "Bursars and admins can manage accounts"
ON public.accounts FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]));

CREATE POLICY "Journal entries viewable by bursars and admins"
ON public.journal_entries FOR SELECT
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]));

CREATE POLICY "Bursars and admins can manage journal entries"
ON public.journal_entries FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]));

CREATE POLICY "Journal entry lines viewable by bursars and admins"
ON public.journal_entry_lines FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.journal_entries je
        WHERE je.id = journal_entry_id
          AND public.has_tenant_role(je.tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role])
    )
);

CREATE POLICY "Bursars and admins can manage journal entry lines"
ON public.journal_entry_lines FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.journal_entries je
        WHERE je.id = journal_entry_id
          AND public.has_tenant_role(je.tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role])
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.journal_entries je
        WHERE je.id = journal_entry_id
          AND public.has_tenant_role(je.tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role])
    )
);

-- Public CMS Notices & Pages
CREATE POLICY "Public notices viewable by anyone or members"
ON public.tenant_notices FOR SELECT
USING (is_public = true OR (tenant_id IN (SELECT public.get_auth_tenant_ids())));

CREATE POLICY "Admins can manage notices"
ON public.tenant_notices FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));

CREATE POLICY "Public pages viewable by anyone"
ON public.tenant_pages FOR SELECT
USING (is_published = true OR (tenant_id IN (SELECT public.get_auth_tenant_ids())));

CREATE POLICY "Admins can manage pages"
ON public.tenant_pages FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]));

-- Communication Logs
CREATE POLICY "Communication logs viewable by admins"
ON public.communication_logs FOR SELECT
USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]));

CREATE POLICY "Communication logs insertable by admins"
ON public.communication_logs FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]));

