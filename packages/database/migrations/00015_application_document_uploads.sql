-- MDI 00015: private application document upload capability and owner-only review access.
CREATE TABLE IF NOT EXISTS private.madrasa_application_upload_tokens (
  application_id UUID PRIMARY KEY REFERENCES public.madrasa_applications(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at TIMESTAMPTZ NOT NULL,
  upload_count INTEGER NOT NULL DEFAULT 0 CHECK (upload_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE private.madrasa_application_upload_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.madrasa_application_upload_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.madrasa_application_upload_tokens TO service_role;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES (
  'madrasa-application-documents',
  'madrasa-application-documents',
  FALSE,
  10485760,
  ARRAY['application/pdf','image/jpeg','image/png']
)
ON CONFLICT (id) DO UPDATE
SET public=FALSE, file_size_limit=10485760,
    allowed_mime_types=ARRAY['application/pdf','image/jpeg','image/png'];

CREATE OR REPLACE FUNCTION public.submit_madrasa_application(
  p_application JSONB,
  p_upload_token_hash TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, extensions, pg_temp
AS $$
DECLARE
  v_id UUID;
  v_email TEXT := lower(btrim(p_application->>'contact_email'));
BEGIN
  IF p_upload_token_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'invalid_upload_token'; END IF;
  IF length(btrim(COALESCE(p_application->>'institution_name',''))) NOT BETWEEN 2 AND 200
     OR length(btrim(COALESCE(p_application->>'contact_person_name',''))) NOT BETWEEN 2 AND 160
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR p_application->>'institution_type' NOT IN ('qawmi','alia','hybrid')
     OR COALESCE(p_application->>'requested_code','') !~ '^[A-Z0-9][A-Z0-9_-]{1,19}$'
     OR COALESCE(p_application->>'requested_subdomain','') !~ '^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$'
  THEN RAISE EXCEPTION 'invalid_application_data'; END IF;

  IF (SELECT count(*) FROM public.madrasa_applications
      WHERE contact_email=v_email AND submitted_at > now() - interval '24 hours') >= 3
  THEN RAISE EXCEPTION 'application_rate_limit'; END IF;

  INSERT INTO public.madrasa_applications(
    institution_name,institution_name_bn,institution_type,requested_code,requested_subdomain,
    board_affiliation,registration_number,established_year,contact_person_name,contact_email,
    contact_phone,division,district,address,website_url,application_note,status
  ) VALUES (
    btrim(p_application->>'institution_name'),
    NULLIF(btrim(p_application->>'institution_name_bn'),''),
    p_application->>'institution_type',
    upper(p_application->>'requested_code'),
    lower(p_application->>'requested_subdomain'),
    NULLIF(btrim(p_application->>'board_affiliation'),''),
    NULLIF(btrim(p_application->>'registration_number'),''),
    NULLIF(p_application->>'established_year','')::SMALLINT,
    btrim(p_application->>'contact_person_name'),
    v_email,
    btrim(p_application->>'contact_phone'),
    NULLIF(btrim(p_application->>'division'),''),
    NULLIF(btrim(p_application->>'district'),''),
    NULLIF(btrim(p_application->>'address'),''),
    NULLIF(btrim(p_application->>'website_url'),''),
    NULLIF(btrim(p_application->>'application_note'),''),
    'pending'
  ) RETURNING id INTO v_id;

  INSERT INTO private.madrasa_application_upload_tokens(application_id,token_hash,expires_at)
  VALUES(v_id,p_upload_token_hash,now()+interval '7 days');

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_madrasa_application(JSONB,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_madrasa_application(JSONB,TEXT) TO anon, authenticated;

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
        AND a.status='pending'
    );
$$;
REVOKE ALL ON FUNCTION private.can_upload_madrasa_application_document(UUID,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_upload_madrasa_application_document(UUID,TEXT) TO anon, authenticated;

DROP POLICY IF EXISTS "Applicant token can upload Madrasa application documents" ON storage.objects;
CREATE POLICY "Applicant token can upload Madrasa application documents"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id='madrasa-application-documents'
  AND array_length(storage.foldername(name),1)=2
  AND private.can_upload_madrasa_application_document(
    (storage.foldername(name))[1]::UUID,
    (storage.foldername(name))[2]
  )
);

DROP POLICY IF EXISTS "Global owner can review Madrasa application documents" ON storage.objects;
CREATE POLICY "Global owner can review Madrasa application documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id='madrasa-application-documents'
  AND (SELECT private.is_platform_owner())
);

CREATE OR REPLACE FUNCTION public.register_madrasa_application_document(
  p_application_id UUID,
  p_token TEXT,
  p_path TEXT,
  p_document_type TEXT,
  p_original_file_name TEXT,
  p_mime_type TEXT,
  p_file_size_bytes BIGINT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, extensions, storage, pg_temp
AS $$
DECLARE
  v_doc_id UUID;
BEGIN
  IF NOT private.can_upload_madrasa_application_document(p_application_id,p_token) THEN
    RAISE EXCEPTION 'invalid_or_expired_upload_capability' USING ERRCODE='42501';
  END IF;
  IF p_document_type NOT IN ('registration','board_affiliation','identity','authorization','other')
     OR p_file_size_bytes<=0 OR p_file_size_bytes>10485760
     OR p_mime_type NOT IN ('application/pdf','image/jpeg','image/png')
     OR p_path NOT LIKE p_application_id::TEXT || '/' || upper(p_token) || '/%'
  THEN RAISE EXCEPTION 'invalid_document_metadata'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id='madrasa-application-documents' AND name=p_path
  ) THEN RAISE EXCEPTION 'uploaded_object_not_found'; END IF;

  INSERT INTO public.madrasa_application_documents(
    application_id,document_type,storage_object_path,original_file_name,mime_type,file_size_bytes
  ) VALUES (
    p_application_id,p_document_type,p_path,left(p_original_file_name,255),p_mime_type,p_file_size_bytes
  ) RETURNING id INTO v_doc_id;

  UPDATE private.madrasa_application_upload_tokens
    SET upload_count=upload_count+1
    WHERE application_id=p_application_id;

  RETURN v_doc_id;
END;
$$;
REVOKE ALL ON FUNCTION public.register_madrasa_application_document(UUID,TEXT,TEXT,TEXT,TEXT,TEXT,BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_madrasa_application_document(UUID,TEXT,TEXT,TEXT,TEXT,TEXT,BIGINT) TO anon, authenticated;

COMMENT ON TABLE private.madrasa_application_upload_tokens IS
  'Private, expiring capability hashes for application document uploads. Raw upload tokens are returned once to the applicant and never stored.';
