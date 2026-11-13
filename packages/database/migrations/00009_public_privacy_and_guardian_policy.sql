-- MDI 00009: close legacy public guardian insertion and minimize public Sanad disclosure.
-- Keep tenant helper functions available to RLS; they return no tenant access for anon users.
DROP POLICY IF EXISTS "Public admission guardian submission" ON public.student_guardians;

-- Auth profile creation is invoked by the Auth trigger, not as a client RPC.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Preserve the existing RPC signature for application compatibility while withholding
-- direct identifiers, token material, student identity and signatory personal data.
DROP FUNCTION public.verify_sanad_public(TEXT);

CREATE FUNCTION public.verify_sanad_public(p_token TEXT)
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
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
    SELECT
      NULL::UUID,
      s.sanad_serial_no,
      s.title_bn,
      s.title_en,
      s.title_ar,
      s.marhala_name_ar,
      s.result_dharja,
      s.gpa,
      s.issue_date,
      NULL::VARCHAR,
      s.status,
      NULL::VARCHAR,
      NULL::VARCHAR,
      t.name,
      t.code,
      NULL::VARCHAR,
      NULL::VARCHAR,
      NULL::VARCHAR
    FROM public.sanads AS s
    JOIN public.tenants AS t ON t.id = s.tenant_id
    WHERE p_token ~ '^[A-Fa-f0-9]{64}$'
      AND s.verification_hash = upper(p_token)
      AND s.status = 'issued'
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_sanad_public(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_sanad_public(TEXT) TO anon, authenticated;
