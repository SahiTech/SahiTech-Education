-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    CREATE TYPE curriculum_type AS ENUM ('qawmi', 'alia', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',
        'madrasa_admin',
        'academic_dean',
        'teacher',
        'student',
        'parent',
        'accountant',
        'hostel_warden'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('unpaid', 'partially_paid', 'paid', 'waived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Tenants (Madrasas)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    curriculum_type curriculum_type NOT NULL DEFAULT 'qawmi',
    registration_no VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    district VARCHAR(100),
    division VARCHAR(100),
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Branches
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    is_main_branch BOOLEAN NOT NULL DEFAULT false,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, code)
);

-- 3. User Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name_bn VARCHAR(255),
    full_name_en VARCHAR(255) NOT NULL,
    full_name_ar VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Tenant Users (Multi-tenant membership and roles)
CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, user_id, role)
);

-- 5. Academic Years
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_bn VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    hijri_year VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Academic Departments (e.g., Kitab, Hifzul Quran, Nurani, Alia Ebtedayee)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    curriculum_type curriculum_type NOT NULL DEFAULT 'qawmi',
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, code)
);

-- 7. Classes / Marhalas (e.g. Dawra-e-Hadith, Mishkat, Dakhil, Alim)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    level_order INT NOT NULL DEFAULT 1,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, department_id, code)
);

-- 8. Sections (Jamaat branches)
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    capacity INT DEFAULT 40,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Subjects / Kitabs (e.g. Sahih al-Bukhari, Hidayah, Arabic Grammar, Bangla, Math)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    code VARCHAR(50) NOT NULL,
    total_marks INT NOT NULL DEFAULT 100,
    passing_marks INT NOT NULL DEFAULT 33,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, class_id, code)
);

-- 10. Students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admission_no VARCHAR(100) NOT NULL,
    full_name_bn VARCHAR(255) NOT NULL,
    full_name_en VARCHAR(255) NOT NULL,
    full_name_ar VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20) DEFAULT 'male',
    blood_group VARCHAR(10),
    father_name_bn VARCHAR(255),
    father_name_en VARCHAR(255),
    mother_name_bn VARCHAR(255),
    guardian_phone VARCHAR(50) NOT NULL,
    present_address TEXT,
    permanent_address TEXT,
    is_residential BOOLEAN NOT NULL DEFAULT false,
    is_lillah_boarder BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, admission_no)
);

-- 11. Student Enrollments
CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    roll_no INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(academic_year_id, class_id, section_id, roll_no),
    UNIQUE(academic_year_id, student_id)
);

-- 12. Teachers (Asatiza)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    employee_id VARCHAR(100) NOT NULL,
    full_name_bn VARCHAR(255) NOT NULL,
    full_name_en VARCHAR(255) NOT NULL,
    full_name_ar VARCHAR(255),
    designation VARCHAR(150),
    qualification VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    joining_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, employee_id)
);

-- 13. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, student_id, attendance_date)
);

-- 14. Fee Categories
CREATE TABLE IF NOT EXISTS public.fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. Fee Invoices
CREATE TABLE IF NOT EXISTS public.fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL,
    status invoice_status NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, invoice_number)
);

-- Row Level Security (RLS) Configuration
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's authorized tenant IDs
CREATE OR REPLACE FUNCTION public.get_auth_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT tenant_id 
    FROM public.tenant_users 
    WHERE user_id = auth.uid() 
      AND is_active = true;
$$;

-- RLS Policies
CREATE POLICY "Tenants are viewable by tenant members"
ON public.tenants FOR SELECT
USING (id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Branches are viewable by tenant members"
ON public.branches FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Profiles viewable by self or tenant co-members"
ON public.profiles FOR SELECT
USING (id = auth.uid() OR id IN (
    SELECT tu.user_id FROM public.tenant_users tu 
    WHERE tu.tenant_id IN (SELECT public.get_auth_tenant_ids())
));

CREATE POLICY "Tenant users viewable by tenant members"
ON public.tenant_users FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Academic years viewable by tenant members"
ON public.academic_years FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Departments viewable by tenant members"
ON public.departments FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Classes viewable by tenant members"
ON public.classes FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Sections viewable by tenant members"
ON public.sections FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Subjects viewable by tenant members"
ON public.subjects FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Students viewable by tenant members"
ON public.students FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Student enrollments viewable by tenant members"
ON public.student_enrollments FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Teachers viewable by tenant members"
ON public.teachers FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Attendance viewable by tenant members"
ON public.attendance_records FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Fee categories viewable by tenant members"
ON public.fee_categories FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

CREATE POLICY "Fee invoices viewable by tenant members"
ON public.fee_invoices FOR SELECT
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

