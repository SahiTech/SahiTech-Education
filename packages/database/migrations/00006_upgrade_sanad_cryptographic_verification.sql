-- ============================================================================
-- SahiTech Education — Madrasa Digitalization Initiative (MDI)
-- Migration 00006: Cryptographic Sanad 256-bit Verification & Storage Buckets
-- ============================================================================

-- 1. Upgrade verification_hash column to VARCHAR(128) for full 256-bit cryptographic SHA-256 tokens
ALTER TABLE public.sanads 
    ALTER COLUMN verification_hash TYPE VARCHAR(128);

-- 2. Update/Reinforce the Public Cryptographic Sanad Verification RPC Function (SECURITY DEFINER)
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
    WHERE UPPER(TRIM(s.verification_hash)) = UPPER(TRIM(p_token))
      AND s.status = 'issued';
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_sanad_public(TEXT) TO anon, authenticated, service_role;

-- 3. Initialize Required Production Storage Buckets with RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('madrasa-assets', 'madrasa-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
    ('sanad-documents', 'sanad-documents', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('student-documents', 'student-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies
DO $$
BEGIN
    -- Public read for madrasa-assets & sanad-documents
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for madrasa assets'
    ) THEN
        CREATE POLICY "Public Access for madrasa assets"
        ON storage.objects FOR SELECT
        USING (bucket_id IN ('madrasa-assets', 'sanad-documents'));
    END IF;

    -- Authenticated tenant admin upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Tenant Admins Can Upload Assets'
    ) THEN
        CREATE POLICY "Tenant Admins Can Upload Assets"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id IN ('madrasa-assets', 'sanad-documents', 'student-documents')
            AND auth.role() = 'authenticated'
        );
    END IF;
END $$;

