-- ============================================================================
-- SahiTech Education — Madrasa Digitalization Initiative (MDI)
-- Migration 00005: Public Sanad Verification RPC, Online Inquiries & Public Profiles
-- ============================================================================

-- 1. Enable public read of active tenant basic branding for institutional sites and verification
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tenants' AND policyname = 'Public tenants are viewable'
    ) THEN
        CREATE POLICY "Public tenants are viewable"
        ON public.tenants FOR SELECT
        USING (is_active = true);
    END IF;
END $$;

-- 2. Allow public applicant submissions for online admission inquiry
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_admissions' AND policyname = 'Public admission application submission'
    ) THEN
        CREATE POLICY "Public admission application submission"
        ON public.student_admissions FOR INSERT
        WITH CHECK (status = 'applied');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_guardians' AND policyname = 'Public admission guardian submission'
    ) THEN
        CREATE POLICY "Public admission guardian submission"
        ON public.student_guardians FOR INSERT
        WITH CHECK (true);
    END IF;
END $$;

-- 3. Public Cryptographic Sanad Verification RPC Function (SECURITY DEFINER)
-- Allows anonymous and public third parties (employers, boards, universities)
-- to verify a certificate's authenticity, holder, dharja, and issuing madrasa without exposing private student records.
CREATE OR REPLACE FUNCTION public.verify_sanad_public(p_token TEXT)
RETURNS TABLE (
    id UUID,
    sanad_serial_no VARCHAR,
    title_bn VARCHAR,
    title_en VARCHAR,
    title_ar VARCHAR,
    marhala_name_ar VARCHAR,
    result_dharja public.qawmi_dharja,
    gpa NUMERIC,
    issue_date DATE,
    verification_hash VARCHAR,
    status public.sanad_status,
    signatory_muhtamim VARCHAR,
    signatory_dean VARCHAR,
    madrasa_name VARCHAR,
    madrasa_code VARCHAR,
    student_name_bn VARCHAR,
    student_name_en VARCHAR,
    student_admission_no VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.sanad_serial_no,
        s.title_bn,
        s.title_en,
        s.title_ar,
        s.marhala_name_ar,
        s.result_dharja,
        s.gpa,
        s.issue_date,
        s.verification_hash,
        s.status,
        s.signatory_muhtamim,
        s.signatory_dean,
        t.name AS madrasa_name,
        t.code AS madrasa_code,
        st.full_name_bn AS student_name_bn,
        st.full_name_en AS student_name_en,
        st.admission_no AS student_admission_no
    FROM public.sanads s
    JOIN public.tenants t ON t.id = s.tenant_id
    JOIN public.students st ON st.id = s.student_id
    WHERE UPPER(s.verification_hash) = UPPER(TRIM(p_token))
      AND s.status = 'issued';
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_sanad_public(TEXT) TO anon, authenticated, service_role;
