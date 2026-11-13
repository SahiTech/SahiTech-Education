-- MDI 00018: durable, retryable email delivery queue for verified Resend sender.
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
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;
  IF p_token_hash !~ '^[0-9a-f]{64}$' OR length(p_raw_token) < 40 OR length(p_raw_token) > 160 THEN
    RAISE EXCEPTION 'invalid_invitation_token';
  END IF;
  IF p_invitation_url IS NULL OR length(p_invitation_url) > 2048 OR p_invitation_url !~ '^https://' THEN
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
  ) THEN RAISE EXCEPTION 'tenant_identifier_already_in_use'; END IF;

  UPDATE public.madrasa_applications
    SET status='approved', reviewed_by=v_owner, reviewed_at=now(), updated_at=now()
    WHERE id=p_application_id;

  UPDATE public.platform_invitations
    SET status='revoked', revoked_at=now()
    WHERE application_id=p_application_id AND status IN ('pending','sent');

  INSERT INTO public.platform_invitations(
    application_id,invitee_email,token_hash,status,expires_at,created_by
  ) VALUES (
    p_application_id,v_app.contact_email,p_token_hash,'pending',now()+interval '72 hours',v_owner
  ) RETURNING id INTO v_invitation_id;

  INSERT INTO public.email_outbox(event_type,recipient_email,payload)
  VALUES(
    'madrasa_invitation',v_app.contact_email,
    jsonb_build_object(
      'application_id',p_application_id,
      'invitation_id',v_invitation_id,
      'invitation_url',p_invitation_url,
      'institution_name',v_app.institution_name,
      'expires_at',now()+interval '72 hours'
    )
  );
  RETURN v_invitation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.owner_issue_invitation(UUID,TEXT,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_issue_invitation(UUID,TEXT,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_email_outbox(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(id UUID,event_type TEXT,recipient_email TEXT,payload JSONB,attempts SMALLINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_limit < 1 OR p_limit > 50 THEN RAISE EXCEPTION 'invalid_batch_size'; END IF;
  RETURN QUERY
  WITH picked AS (
    SELECT o.id
    FROM public.email_outbox o
    WHERE o.status IN ('queued','failed')
      AND o.available_at <= now()
      AND o.attempts < 5
    ORDER BY o.available_at,o.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.email_outbox o
    SET status='processing',attempts=o.attempts+1,last_error=NULL
    FROM picked
    WHERE o.id=picked.id
  RETURNING o.id,o.event_type,o.recipient_email,o.payload,o.attempts;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_email_outbox(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_outbox(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_email_outbox(
  p_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_payload JSONB;
  v_attempts SMALLINT;
  v_invitation_id UUID;
BEGIN
  SELECT payload,attempts INTO v_payload,v_attempts
  FROM public.email_outbox
  WHERE id=p_id AND status='processing'
  FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF p_success THEN
    UPDATE public.email_outbox
      SET status='sent',processed_at=now(),last_error=NULL
      WHERE id=p_id;
    v_invitation_id := NULLIF(v_payload->>'invitation_id','')::UUID;
    IF v_invitation_id IS NOT NULL THEN
      UPDATE public.platform_invitations
        SET status='sent',sent_at=now()
        WHERE id=v_invitation_id AND status='pending';
    END IF;
  ELSE
    UPDATE public.email_outbox
      SET status=CASE WHEN v_attempts>=5 THEN 'failed' ELSE 'queued' END,
          available_at=now()+make_interval(mins=>LEAST(60, power(2,v_attempts)::INTEGER)),
          last_error=left(COALESCE(p_error,'Delivery failed'),1000)
      WHERE id=p_id;
  END IF;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_email_outbox(UUID,BOOLEAN,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_email_outbox(UUID,BOOLEAN,TEXT) TO service_role;
