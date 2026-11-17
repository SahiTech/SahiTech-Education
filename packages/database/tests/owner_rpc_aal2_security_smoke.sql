-- Read-only regression checks for the privileged Global Platform Owner RPC surface.
-- Run after migrations 00045-00052 against an isolated development project.
DO $$
DECLARE
  v_name TEXT;
  v_definition TEXT;
  v_required TEXT[] := ARRAY[
    'owner_activate_tenant',
    'owner_issue_invitation',
    'owner_review_application_document',
    'owner_update_application_status',
    'owner_reserve_manual_admin_provisioning',
    'owner_complete_manual_admin_provisioning',
    'owner_fail_manual_admin_provisioning',
    'owner_reserve_manual_admin_password_reset',
    'owner_complete_manual_admin_password_reset',
    'owner_create_manual_admin_credential_handoff',
    'owner_consume_manual_admin_credential_handoff'
  ];
BEGIN
  IF to_regprocedure('public.owner_direct_provision_tenant(uuid,uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Legacy direct tenant provisioning RPC must be retired';
  END IF;

  FOREACH v_name IN ARRAY v_required LOOP
    SELECT pg_get_functiondef(p.oid)
    INTO v_definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=v_name
    ORDER BY p.oid
    LIMIT 1;

    IF v_definition IS NULL THEN
      RAISE EXCEPTION 'Required Owner RPC is missing: %', v_name;
    END IF;
    IF position('auth.jwt()->>''aal'' IS DISTINCT FROM ''aal2''' IN v_definition)=0 THEN
      RAISE EXCEPTION 'Owner RPC is missing database AAL2 guard: %', v_name;
    END IF;
  END LOOP;
END;
$$;
