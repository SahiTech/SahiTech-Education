-- Bind a previously-created verified Auth account to the singleton owner record.
CREATE OR REPLACE FUNCTION private.bind_current_platform_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
DECLARE
  v_email TEXT;
  v_confirmed_at TIMESTAMPTZ;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT email, email_confirmed_at
    INTO v_email, v_confirmed_at
    FROM auth.users
    WHERE id = v_uid;

  IF v_confirmed_at IS NULL OR lower(btrim(COALESCE(v_email,''))) <> (
    SELECT owner_email FROM private.platform_owner WHERE singleton = TRUE
  ) THEN
    RAISE EXCEPTION 'verified_designated_owner_email_required' USING ERRCODE = '42501';
  END IF;

  UPDATE private.platform_owner
    SET auth_user_id = v_uid, updated_at = now()
    WHERE singleton = TRUE
      AND (auth_user_id IS NULL OR auth_user_id = v_uid);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'platform_owner_already_bound' USING ERRCODE = '42501';
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION private.bind_current_platform_owner() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.bind_platform_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
  SELECT private.bind_current_platform_owner();
$$;

REVOKE ALL ON FUNCTION public.bind_platform_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bind_platform_owner() TO authenticated;
