-- MDI 00035: allow corrected document re-uploads after an owner requests information.
-- Rejected documents remain part of the review history; they do not block a replacement
-- once the Owner has verified at least one current supporting document and no pending
-- uploads remain.
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

  SELECT * INTO v_app FROM public.madrasa_applications WHERE id=p_application_id FOR UPDATE;
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
    WHERE application_id=p_application_id AND verification_status='verified'
  ) THEN
    RAISE EXCEPTION 'at_least_one_application_document_must_be_verified';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id=p_application_id AND verification_status='pending'
  ) THEN
    RAISE EXCEPTION 'pending_application_documents_must_be_reviewed';
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
