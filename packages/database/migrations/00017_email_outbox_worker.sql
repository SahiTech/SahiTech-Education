-- MDI 00017: enqueue application receipts and provide an atomic, retryable outbox worker API.
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

  INSERT INTO public.email_outbox(event_type,recipient_email,payload)
  VALUES (
    'madrasa_application_received',
    v_email,
    jsonb_build_object(
      'application_id',v_id,
      'institution_name',btrim(p_application->>'institution_name'),
      'contact_person_name',btrim(p_application->>'contact_person_name')
    )
  );

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_madrasa_application(JSONB,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_madrasa_application(JSONB,TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_email_outbox_batch(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.email_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_limit < 1 OR p_limit > 50 THEN RAISE EXCEPTION 'invalid_batch_size'; END IF;
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.email_outbox
    WHERE status='queued' AND available_at<=now() AND attempts<5
    ORDER BY available_at,created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.email_outbox e
    SET status='processing',attempts=attempts+1
    FROM candidates c
    WHERE e.id=c.id
    RETURNING e.*;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_email_outbox_batch(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_outbox_batch(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.finish_email_outbox(
  p_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE v_attempts INTEGER;
BEGIN
  SELECT attempts INTO v_attempts
  FROM public.email_outbox
  WHERE id=p_id AND status='processing'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'outbox_item_not_processing'; END IF;

  UPDATE public.email_outbox
  SET status=CASE
      WHEN p_success THEN 'sent'
      WHEN v_attempts>=5 THEN 'failed'
      ELSE 'queued'
    END,
    available_at=CASE
      WHEN p_success THEN available_at
      ELSE now() + make_interval(secs => LEAST(3600, 30 * power(2, GREATEST(v_attempts-1,0))::INTEGER))
    END,
    processed_at=CASE WHEN p_success THEN now() ELSE NULL END,
    last_error=CASE WHEN p_success THEN NULL ELSE left(COALESCE(p_error,'Email delivery failed'),2000) END
  WHERE id=p_id;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.finish_email_outbox(UUID,BOOLEAN,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_email_outbox(UUID,BOOLEAN,TEXT) TO service_role;
