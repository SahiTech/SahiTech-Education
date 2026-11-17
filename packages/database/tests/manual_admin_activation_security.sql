-- Run only after migration 00046 has been applied to an isolated development database.
-- This file intentionally performs read-only catalog and privilege assertions.

DO $$
BEGIN
  IF to_regprocedure('public.owner_direct_setup_madrasa_admin(uuid,text,boolean)') IS NOT NULL THEN
    RAISE EXCEPTION 'legacy_direct_provision_rpc_must_be_removed';
  END IF;

  IF to_regprocedure('public.owner_reserve_manual_admin_provisioning(uuid,text,boolean)') IS NULL
     OR to_regprocedure('public.owner_complete_manual_admin_provisioning(uuid,uuid)') IS NULL
     OR to_regprocedure('public.record_manual_admin_password_change()') IS NULL THEN
    RAISE EXCEPTION 'manual_admin_workflow_functions_missing';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='private.manual_admin_provisionings'::regclass) THEN
    RAISE EXCEPTION 'manual_provisionings_rls_must_be_enabled';
  END IF;

  IF has_table_privilege('anon', 'private.manual_admin_provisionings', 'SELECT')
     OR has_table_privilege('authenticated', 'private.manual_admin_provisionings', 'SELECT') THEN
    RAISE EXCEPTION 'manual_provisionings_must_not_be_directly_readable';
  END IF;

  IF has_table_privilege('anon', 'private.manual_admin_password_reset_requests', 'SELECT')
     OR has_table_privilege('authenticated', 'private.manual_admin_password_reset_requests', 'SELECT') THEN
    RAISE EXCEPTION 'manual_password_reset_requests_must_not_be_directly_readable';
  END IF;

  IF has_function_privilege('anon', 'public.owner_reserve_manual_admin_provisioning(uuid,text,boolean)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.owner_complete_manual_admin_provisioning(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.owner_reserve_manual_admin_password_reset(uuid,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anonymous_manual_admin_provisioning_must_be_denied';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.owner_reserve_manual_admin_provisioning(uuid,text,boolean)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.owner_complete_manual_admin_provisioning(uuid,uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.record_manual_admin_password_change()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated_rpc_execution_grants_missing';
  END IF;

  IF has_function_privilege('anon', 'private.can_use_mdi_tenant_features()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'private.can_use_mdi_tenant_features()', 'EXECUTE') THEN
    RAISE EXCEPTION 'internal_password_gate_helper_must_not_be_directly_callable';
  END IF;

  IF NOT has_function_privilege('authenticated', 'private.get_auth_tenant_ids()', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'private.has_tenant_role(uuid,public.user_role[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'existing_rls_helper_grants_must_be_preserved';
  END IF;
END;
$$;

SELECT 'manual_admin_activation_security_smoke_checks_passed' AS result;
