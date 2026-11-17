-- Single-use, short-lived Owner credential handoff.
-- The credential payload remains encrypted in an HttpOnly cookie; only its nonce hash is stored here.
CREATE TABLE IF NOT EXISTS private.manual_admin_credential_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nonce_hash TEXT NOT NULL UNIQUE CHECK (nonce_hash ~ '^[0-9a-f]{64}$'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 seconds'),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_admin_credential_handoffs_expiry_idx
  ON private.manual_admin_credential_handoffs (expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE private.manual_admin_credential_handoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.manual_admin_credential_handoffs FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.owner_create_manual_admin_credential_handoff(p_nonce_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
BEGIN
  IF v_owner IS NULL
     OR auth.jwt()->>'aal' IS DISTINCT FROM 'aal2'
     OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'aal2_platform_owner_required' USING ERRCODE='42501';
  END IF;
  IF p_nonce_hash IS NULL OR p_nonce_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid_credential_handoff_nonce';
  END IF;

  DELETE FROM private.manual_admin_credential_handoffs
  WHERE expires_at < now() OR consumed_at IS NOT NULL;

  INSERT INTO private.manual_admin_credential_handoffs(owner_user_id, nonce_hash)
  VALUES (v_owner, p_nonce_hash);
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_consume_manual_admin_credential_handoff(p_nonce_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_handoff_id UUID;
BEGIN
  IF v_owner IS NULL
     OR auth.jwt()->>'aal' IS DISTINCT FROM 'aal2'
     OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'aal2_platform_owner_required' USING ERRCODE='42501';
  END IF;
  IF p_nonce_hash IS NULL OR p_nonce_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN FALSE;
  END IF;

  UPDATE private.manual_admin_credential_handoffs
  SET consumed_at = now()
  WHERE nonce_hash = p_nonce_hash
    AND owner_user_id = v_owner
    AND consumed_at IS NULL
    AND expires_at > now()
  RETURNING id INTO v_handoff_id;

  RETURN v_handoff_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_create_manual_admin_credential_handoff(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owner_consume_manual_admin_credential_handoff(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_create_manual_admin_credential_handoff(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_consume_manual_admin_credential_handoff(TEXT) TO authenticated;

COMMENT ON TABLE private.manual_admin_credential_handoffs IS
  'Short-lived, single-use, Owner-bound nonce records for retrieving encrypted temporary manual-admin credentials. No credential plaintext is stored.';
