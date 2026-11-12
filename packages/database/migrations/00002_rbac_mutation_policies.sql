-- Migration: 00002_rbac_mutation_policies.sql
-- Description: Define audit_logs table, auth user profile trigger, has_tenant_role helper, and granular mutation RLS policies

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role VARCHAR(50) NOT NULL,
    is_support_impersonation BOOLEAN NOT NULL DEFAULT false,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions for role checks with search_path security
CREATE OR REPLACE FUNCTION public.has_tenant_role(target_tenant_id UUID, required_roles user_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.tenant_users 
        WHERE tenant_id = target_tenant_id 
          AND user_id = auth.uid() 
          AND role = ANY(required_roles)
          AND is_active = true
    );
$$;

-- 3. Automatic user profile creation trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name_en, full_name_bn, phone, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name_en', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'full_name_bn',
        new.phone,
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name_en = COALESCE(EXCLUDED.full_name_en, profiles.full_name_en),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 4. Mutation Policies (INSERT, UPDATE, DELETE)

-- Profiles
DO $$ BEGIN
    CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tenants
DO $$ BEGIN
    CREATE POLICY "Admins can update tenant settings"
    ON public.tenants FOR UPDATE
    USING (public.has_tenant_role(id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]))
    WITH CHECK (public.has_tenant_role(id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Branches
DO $$ BEGIN
    CREATE POLICY "Admins can manage branches"
    ON public.branches FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tenant Users
DO $$ BEGIN
    CREATE POLICY "Admins can manage tenant users"
    ON public.tenant_users FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Academic Years
DO $$ BEGIN
    CREATE POLICY "Academic admins can manage academic years"
    ON public.academic_years FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Departments
DO $$ BEGIN
    CREATE POLICY "Academic admins can manage departments"
    ON public.departments FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Classes
DO $$ BEGIN
    CREATE POLICY "Academic admins can manage classes"
    ON public.classes FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Sections
DO $$ BEGIN
    CREATE POLICY "Academic admins can manage sections"
    ON public.sections FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Subjects
DO $$ BEGIN
    CREATE POLICY "Academic admins can manage subjects"
    ON public.subjects FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Students
DO $$ BEGIN
    CREATE POLICY "Admins and deans can manage students"
    ON public.students FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Student Enrollments
DO $$ BEGIN
    CREATE POLICY "Academic admins can manage enrollments"
    ON public.student_enrollments FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Teachers
DO $$ BEGIN
    CREATE POLICY "Admins can manage teachers"
    ON public.teachers FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Attendance Records
DO $$ BEGIN
    CREATE POLICY "Teachers and academic staff can manage attendance"
    ON public.attendance_records FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role, 'teacher'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'academic_dean'::user_role, 'teacher'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Fee Categories
DO $$ BEGIN
    CREATE POLICY "Bursars can manage fee categories"
    ON public.fee_categories FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Fee Invoices
DO $$ BEGIN
    CREATE POLICY "Bursars can manage fee invoices"
    ON public.fee_invoices FOR ALL
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]))
    WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role, 'accountant'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Audit Logs
DO $$ BEGIN
    CREATE POLICY "Audit logs viewable by madrasa admins"
    ON public.audit_logs FOR SELECT
    USING (public.has_tenant_role(tenant_id, ARRAY['super_admin'::user_role, 'madrasa_admin'::user_role]));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Audit logs insertable by members"
    ON public.audit_logs FOR INSERT
    WITH CHECK (tenant_id IN (SELECT public.get_auth_tenant_ids()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

