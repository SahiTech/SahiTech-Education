-- Enforce AAL2 inside the database boundary, not only in Next.js routes.
-- Existing Owner RPCs remain directly callable through PostgREST, so API checks alone are insufficient.
DO $$
DECLARE
  v_function RECORD;
  v_definition TEXT;
  v_updated INTEGER := 0;
  v_old TEXT := 'IF v_owner IS NULL OR NOT private.is_platform_owner() THEN';
  v_new TEXT := 'IF v_owner IS NULL OR auth.jwt()->>''aal'' IS DISTINCT FROM ''aal2'' OR NOT private.is_platform_owner() THEN';
BEGIN
  FOR v_function IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'owner_reserve_manual_admin_provisioning',
        'owner_complete_manual_admin_provisioning',
        'owner_fail_manual_admin_provisioning',
        'owner_reserve_manual_admin_password_reset',
        'owner_complete_manual_admin_password_reset'
      )
  LOOP
    v_definition := replace(v_function.definition, v_old, v_new);
    IF v_definition = v_function.definition THEN
      IF position('auth.jwt()->>''aal'' IS DISTINCT FROM ''aal2''' IN v_function.definition) = 0 THEN
        RAISE EXCEPTION 'AAL2 guard pattern missing in %', v_function.proname;
      END IF;
    ELSE
      EXECUTE v_definition;
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  IF v_updated <> 5 THEN
    RAISE EXCEPTION 'Expected to harden 5 manual-admin Owner RPCs; updated %', v_updated;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.owner_reserve_manual_admin_provisioning(UUID,TEXT,BOOLEAN,TEXT,TEXT) IS
  'AAL2-only Owner reservation for email-independent manual madrasa admin provisioning.';
COMMENT ON FUNCTION public.owner_reserve_manual_admin_password_reset(UUID,TEXT,TEXT) IS
  'AAL2-only Owner reservation for manual madrasa admin password recovery.';
