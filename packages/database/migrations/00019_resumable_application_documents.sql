-- MDI 00019: provide a resumable, fragment-token document upload link by email.
DROP FUNCTION IF EXISTS public.submit_madrasa_application(JSONB,TEXT);

CREATE OR REPLACE FUNCTION public.submit_madrasa_application(
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
  v_id UUID;
  v_email TEXT := lower(btrim(p_application->>'contact_email'));
BEGIN
  IF p_upload_token_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'invalid_upload_token'; END IF;
  IF p_upload_url IS NULL OR length(p_upload_url)>2048 OR p_upload_url !~ '^https://' THEN
    RAISE EXCEPTION 'invalid_upload_url';
  END IF;
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
      'contact_person_name',btrim(p_application->>'contact_person_name'),
      'upload_url',p_upload_url
    )
  );

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_madrasa_application(JSONB,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_madrasa_application(JSONB,TEXT,TEXT) TO anon, authenticated;
