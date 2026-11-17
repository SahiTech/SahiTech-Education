-- Rate-limit direct AAL2 Owner calls to the credential handoff RPC and cover the owner FK.
CREATE INDEX IF NOT EXISTS manual_admin_credential_handoffs_owner_created_idx
  ON private.manual_admin_credential_handoffs(owner_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.owner_create_manual_admin_credential_handoff(p_nonce_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_recent_count INTEGER;
BEGIN
  IF v_owner IS NULL
     OR auth.jwt()->>'aal' IS DISTINCT FROM 'aal2'
     OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'aal2_platform_owner_required' USING ERRCODE='42501';
  END IF;
  IF p_nonce_hash IS NULL OR p_nonce_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid_credential_handoff_nonce';
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM private.manual_admin_credential_handoffs
  WHERE owner_user_id=v_owner
    AND created_at>now()-interval '1 hour';
  IF v_recent_count>=10 THEN
    RAISE EXCEPTION 'manual_admin_credential_handoff_rate_limited';
  END IF;

  DELETE FROM private.manual_admin_credential_handoffs
  WHERE expires_at<now() OR consumed_at IS NOT NULL;

  INSERT INTO private.manual_admin_credential_handoffs(owner_user_id,nonce_hash)
  VALUES(v_owner,p_nonce_hash);
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_create_manual_admin_credential_handoff(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_create_manual_admin_credential_handoff(TEXT) TO authenticated;

COMMENT ON FUNCTION public.owner_create_manual_admin_credential_handoff(TEXT) IS
  'AAL2-only Owner credential handoff nonce reservation, limited to 10 per Owner per hour.';
