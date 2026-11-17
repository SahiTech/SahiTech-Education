-- Enforce AAL2 inside the database boundary, not only in Next.js routes.
-- Existing Owner RPCs remain directly callable through PostgREST, so API checks alone are insufficient.
-- Earlier migrations may already have added the same predicate. This migration is
-- deliberately idempotent: it accepts pre-hardened definitions, repairs the
-- known legacy predicate, and fails if any required RPC is absent or unguarded.
DO $$
DECLARE
  v_function RECORD;
  v_definition TEXT;
  v_required TEXT[] := ARRAY[
    'owner_reserve_manual_admin_provisioning',
    'owner_complete_manual_admin_provisioning',
    'owner_fail_manual_admin_provisioning',
    'owner_reserve_manual_admin_password_reset',
    'owner_complete_manual_admin_password_reset'
  ];
  v_found INTEGER := 0;
  v_guarded INTEGER := 0;
  v_old TEXT := 'IF v_owner IS NULL OR NOT private.is_platform_owner() THEN';
  v_new TEXT := 'IF v_owner IS NULL OR auth.jwt()->>''aal'' IS DISTINCT FROM ''aal2'' OR NOT private.is_platform_owner() THEN';
BEGIN
  FOR v_function IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY(v_required)
  LOOP
    v_found := v_found + 1;
    v_definition := replace(v_function.definition, v_old, v_new);

    IF v_definition <> v_function.definition THEN
      EXECUTE v_definition;
      v_definition := pg_get_functiondef(v_function.oid);
    END IF;

    IF position('auth.jwt()->>''aal'' IS DISTINCT FROM ''aal2''' IN v_definition) = 0 THEN
      RAISE EXCEPTION 'AAL2 guard missing in %', v_function.proname;
    END IF;

    v_guarded := v_guarded + 1;
  END LOOP;

  IF v_found <> cardinality(v_required) OR v_guarded <> cardinality(v_required) THEN
    RAISE EXCEPTION
      'Expected % manual-admin Owner RPCs; found %, verified % AAL2 guards',
      cardinality(v_required), v_found, v_guarded;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.owner_reserve_manual_admin_provisioning(UUID,TEXT,BOOLEAN,TEXT,TEXT) IS
  'AAL2-only Owner reservation for email-independent manual madrasa admin provisioning.';
COMMENT ON FUNCTION public.owner_reserve_manual_admin_password_reset(UUID,TEXT,TEXT) IS
  'AAL2-only Owner reservation for manual madrasa admin password recovery.';
