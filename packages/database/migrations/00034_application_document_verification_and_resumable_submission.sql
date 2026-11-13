-- MDI 00034: consolidate capability-based application uploads and mandatory document verification.
-- This is the canonical follow-up to migrations 00008-00033; it supersedes interim
-- application submission/outbox definitions created during development.

ALTER TABLE public.madrasa_application_documents
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.madrasa_application_documents'::regclass
      AND conname='madrasa_application_documents_verification_status_check'
  ) THEN
    ALTER TABLE public.madrasa_application_documents
      ADD CONSTRAINT madrasa_application_documents_verification_status_check
      CHECK (verification_status IN ('pending','verified','rejected'));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.can_upload_madrasa_application_document(
  p_application_id UUID,
  p_token TEXT
)
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

CREATE OR REPLACE FUNCTION public.submit_madrasa_application(
  p_application_id UUID,
  p_application JSONB,
  p_upload_token_hash TEXT,
  p_upload_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, extensions, pg_temp
AS $$
DECLARE
  v_email TEXT := lower(btrim(p_application->>'contact_email'));
BEGIN
  IF p_application_id IS NULL OR p_upload_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid_application_or_upload_token';
  END IF;
  IF p_upload_url IS NULL OR length(p_upload_url)>2048 OR p_upload_url !~ '^https://' THEN
    RAISE EXCEPTION 'invalid_upload_url';
  END IF;
  IF length(btrim(COALESCE(p_application->>'institution_name',''))) NOT BETWEEN 2 AND 200
     OR length(btrim(COALESCE(p_application->>'contact_person_name',''))) NOT BETWEEN 2 AND 160
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR p_application->>'institution_type' NOT IN ('qawmi','alia','hybrid')
     OR COALESCE(p_application->>'requested_code','') !~ '^[A-Z0-9][A-Z0-9_-]{1,19}$'
     OR COALESCE(p_application->>'requested_subdomain','') !~ '^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$'
  THEN
    RAISE EXCEPTION 'invalid_application_data';
  END IF;

  IF (SELECT count(*) FROM public.madrasa_applications
      WHERE contact_email=v_email AND submitted_at>now()-interval '24 hours')>=3 THEN
    RAISE EXCEPTION 'application_rate_limit';
  END IF;

  INSERT INTO public.madrasa_applications(
    id,institution_name,institution_name_bn,institution_type,requested_code,requested_subdomain,
    board_affiliation,registration_number,established_year,contact_person_name,contact_email,
    contact_phone,division,district,address,website_url,application_note,status
  ) VALUES (
    p_application_id,
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
  );

  INSERT INTO private.madrasa_application_upload_tokens(application_id,token_hash,expires_at)
  VALUES(p_application_id,p_upload_token_hash,now()+interval '7 days');

  INSERT INTO public.email_outbox(event_type,recipient_email,payload)
  VALUES (
    'madrasa_application_received',
    v_email,
    jsonb_build_object(
      'application_id',p_application_id,
      'institution_name',btrim(p_application->>'institution_name'),
      'contact_person_name',btrim(p_application->>'contact_person_name'),
      'upload_url',p_upload_url
    )
  );

  RETURN p_application_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_madrasa_application(UUID,JSONB,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_madrasa_application(UUID,JSONB,TEXT,TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.owner_review_application_document(
  p_document_id UUID,
  p_status TEXT,
  p_review_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE='42501';
  END IF;
  IF p_status NOT IN ('verified','rejected') THEN
    RAISE EXCEPTION 'invalid_document_review_status';
  END IF;

  UPDATE public.madrasa_application_documents
    SET verification_status=p_status,
        reviewed_by=auth.uid(),
        reviewed_at=now(),
        review_note=NULLIF(left(btrim(COALESCE(p_review_note,'')),2000),'')
    WHERE id=p_document_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'application_document_not_found'; END IF;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.owner_review_application_document(UUID,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_review_application_document(UUID,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_issue_invitation(
  p_application_id UUID,
  p_token_hash TEXT,
  p_raw_token TEXT,
  p_invitation_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, extensions, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_app public.madrasa_applications%ROWTYPE;
  v_invitation_id UUID;
  v_expires_at TIMESTAMPTZ := now()+interval '72 hours';
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE='42501';
  END IF;
  IF p_token_hash !~ '^[0-9a-f]{64}$'
     OR length(p_raw_token)<>64
     OR p_token_hash<>encode(extensions.digest(upper(p_raw_token),'sha256'),'hex') THEN
    RAISE EXCEPTION 'invalid_invitation_token';
  END IF;
  IF p_invitation_url IS NULL OR length(p_invitation_url)>2048 OR p_invitation_url !~ '^https://' THEN
    RAISE EXCEPTION 'invalid_invitation_url';
  END IF;

  SELECT * INTO v_app
  FROM public.madrasa_applications
  WHERE id=p_application_id
  FOR UPDATE;
  IF NOT FOUND OR v_app.status NOT IN ('pending','under_review','info_requested','approved') THEN
    RAISE EXCEPTION 'application_not_invitable';
  END IF;
  IF v_app.requested_code IS NULL OR v_app.requested_subdomain IS NULL THEN
    RAISE EXCEPTION 'application_missing_tenant_identifiers';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.tenants
    WHERE upper(code)=upper(v_app.requested_code)
       OR lower(COALESCE(subdomain,''))=lower(v_app.requested_subdomain)
  ) THEN
    RAISE EXCEPTION 'tenant_identifier_already_in_use';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.platform_invitations
    WHERE application_id=p_application_id AND status='accepted'
  ) OR EXISTS (
    SELECT 1 FROM public.tenants WHERE source_application_id=p_application_id
  ) THEN
    RAISE EXCEPTION 'application_already_accepted_or_provisioned';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id=p_application_id
  ) THEN
    RAISE EXCEPTION 'application_documents_required';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id=p_application_id AND verification_status<>'verified'
  ) THEN
    RAISE EXCEPTION 'all_application_documents_must_be_verified';
  END IF;

  UPDATE public.email_outbox
    SET status='cancelled',last_error='Superseded by a replacement invitation'
    WHERE status IN ('queued','failed')
      AND payload->>'application_id'=p_application_id::TEXT;

  UPDATE public.madrasa_applications
    SET status='approved',reviewed_by=v_owner,reviewed_at=now(),updated_at=now()
    WHERE id=p_application_id;

  UPDATE public.platform_invitations
    SET status='revoked',revoked_at=now()
    WHERE application_id=p_application_id AND status IN ('pending','sent');

  INSERT INTO public.platform_invitations(
    application_id,invitee_email,token_hash,status,expires_at,created_by
  ) VALUES (
    p_application_id,v_app.contact_email,p_token_hash,'pending',v_expires_at,v_owner
  ) RETURNING id INTO v_invitation_id;

  INSERT INTO public.email_outbox(event_type,recipient_email,payload)
  VALUES(
    'madrasa_invitation',v_app.contact_email,
    jsonb_build_object(
      'application_id',p_application_id,
      'invitation_id',v_invitation_id,
      'invitation_url',p_invitation_url,
      'institution_name',v_app.institution_name,
      'expires_at',v_expires_at
    )
  );
  RETURN v_invitation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.owner_issue_invitation(UUID,TEXT,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_issue_invitation(UUID,TEXT,TEXT,TEXT) TO authenticated;

COMMENT ON COLUMN public.madrasa_application_documents.verification_status IS
  'Every supporting document must be individually verified by the singleton Global Platform Owner before invitation issuance.';
