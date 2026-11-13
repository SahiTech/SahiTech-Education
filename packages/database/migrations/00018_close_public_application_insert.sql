-- MDI 00018: close direct public table inserts and permit capability-based follow-up uploads.
DROP POLICY IF EXISTS "Public can submit pending Madrasa applications" ON public.madrasa_applications;

CREATE OR REPLACE FUNCTION private.can_upload_madrasa_application_document(p_application_id UUID,p_token TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, extensions, pg_temp
AS $$
  SELECT p_token ~ '^[A-Fa-f0-9]{64}$'
    AND EXISTS (
      SELECT 1
      FROM private.madrasa_application_upload_tokens t
      JOIN public.madrasa_applications a ON a.id=t.application_id
      WHERE t.application_id=p_application_id
        AND t.token_hash=encode(extensions.digest(upper(p_token),'sha256'),'hex')
        AND t.expires_at>now()
        AND t.upload_count<10
        AND a.status IN ('pending','info_requested')
    );
$$;
REVOKE ALL ON FUNCTION private.can_upload_madrasa_application_document(UUID,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_upload_madrasa_application_document(UUID,TEXT) TO anon, authenticated;

COMMENT ON POLICY "Applicant token can upload Madrasa application documents" ON storage.objects IS
  'Uploads require an expiring capability token and are permitted only while the application is pending or awaiting requested information.';
