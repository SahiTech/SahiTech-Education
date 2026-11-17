-- MDI 00052: retire the unused legacy tenant-provisioning RPC and
-- enforce Owner AAL2 at the database boundary for lifecycle mutations.
--
-- owner_direct_provision_tenant has no current web application caller and
-- provides an obsolete alternate path around the reservation-based workflows.
-- Do not restore it; use invitation acceptance or manual-admin reservations.
DROP FUNCTION IF EXISTS public.owner_direct_provision_tenant(UUID, UUID);

DO $$
DECLARE
  v_function RECORD;
  v_definition TEXT;
  v_required TEXT[] := ARRAY[
    'owner_activate_tenant',
    'owner_issue_invitation',
    'owner_review_application_document',
    'owner_update_application_status'
  ];
  v_found INTEGER := 0;
  v_guarded INTEGER := 0;
  v_owner_old TEXT := 'IF v_owner IS NULL OR NOT private.is_platform_owner() THEN';
  v_owner_new TEXT := 'IF v_owner IS NULL OR auth.jwt()->>''aal'' IS DISTINCT FROM ''aal2'' OR NOT private.is_platform_owner() THEN';
  v_uid_old TEXT := 'IF auth.uid() IS NULL OR NOT private.is_platform_owner() THEN';
  v_uid_new TEXT := 'IF auth.uid() IS NULL OR auth.jwt()->>''aal'' IS DISTINCT FROM ''aal2'' OR NOT private.is_platform_owner() THEN';
BEGIN
  FOR v_function IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY(v_required)
  LOOP
    v_found := v_found + 1;
    v_definition := replace(v_function.definition, v_owner_old, v_owner_new);
    v_definition := replace(v_definition, v_uid_old, v_uid_new);

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
      'Expected % lifecycle Owner RPCs; found %, verified % AAL2 guards',
      cardinality(v_required), v_found, v_guarded;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.owner_activate_tenant(UUID) IS
  'AAL2-only Global Platform Owner final activation after approved onboarding and accepted invitation.';
COMMENT ON FUNCTION public.owner_issue_invitation(UUID, TEXT, TEXT) IS
  'AAL2-only Global Platform Owner invitation issuance.';
COMMENT ON FUNCTION public.owner_review_application_document(UUID, TEXT, TEXT) IS
  'AAL2-only Global Platform Owner application-document verification decision.';
COMMENT ON FUNCTION public.owner_update_application_status(UUID, TEXT, TEXT) IS
  'AAL2-only Global Platform Owner application review status transition.';
