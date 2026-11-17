-- Run only after migrations 00045-00047 have been applied to an isolated development database.
-- Read-only catalogue and privilege assertions. No account, tenant, or application data is modified.

DO $$
BEGIN
  IF to_regprocedure('public.owner_direct_setup_madrasa_admin(uuid,text,boolean)') IS NOT NULL THEN
    RAISE EXCEPTION 'legacy_direct_provision_rpc_must_be_removed';
  END IF;

  IF to_regprocedure('public.owner_reserve_manual_admin_provisioning(uuid,text,boolean)') IS NOT NULL THEN
    RAISE EXCEPTION 'legacy_three_argument_reservation_rpc_must_be_removed';
  END IF;

  IF to_regprocedure('public.owner_reserve_manual_admin_provisioning(uuid,text,boolean,text,text)') IS NULL
     OR to_regprocedure('public.owner_complete_manual_admin_provisioning(uuid,uuid)') IS NULL
     OR to_regprocedure('public.owner_fail_manual_admin_provisioning(uuid,text)') IS NULL
     OR to_regprocedure('public.owner_reserve_manual_admin_password_reset(uuid,text,text)') IS NULL
     OR to_regprocedure('public.owner_complete_manual_admin_password_reset(uuid,boolean,text)') IS NULL
     OR to_regprocedure('public.record_manual_admin_password_change()') IS NULL
     OR to_regprocedure('public.mdi_manual_password_change_required()') IS NULL THEN
    RAISE EXCEPTION 'manual_admin_workflow_functions_missing';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='private.manual_admin_provisionings'::regclass) THEN
    RAISE EXCEPTION 'manual_provisionings_rls_must_be_enabled';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='private.manual_admin_password_reset_requests'::regclass) THEN
    RAISE EXCEPTION 'manual_password_reset_requests_rls_must_be_enabled';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='private.manual_admin_password_change_events'::regclass) THEN
    RAISE EXCEPTION 'manual_password_change_events_rls_must_be_enabled';
  END IF;

  IF has_table_privilege('anon','private.manual_admin_provisionings','SELECT')
     OR has_table_privilege('authenticated','private.manual_admin_provisionings','SELECT')
     OR has_table_privilege('anon','private.manual_admin_password_reset_requests','SELECT')
     OR has_table_privilege('authenticated','private.manual_admin_password_reset_requests','SELECT')
     OR has_table_privilege('anon','private.manual_admin_password_change_events','SELECT')
     OR has_table_privilege('authenticated','private.manual_admin_password_change_events','SELECT') THEN
    RAISE EXCEPTION 'private_manual_admin_tables_must_not_be_directly_readable';
  END IF;

  IF has_function_privilege('anon','public.owner_reserve_manual_admin_provisioning(uuid,text,boolean,text,text)','EXECUTE')
     OR has_function_privilege('anon','public.owner_complete_manual_admin_provisioning(uuid,uuid)','EXECUTE')
     OR has_function_privilege('anon','public.owner_reserve_manual_admin_password_reset(uuid,text,text)','EXECUTE')
     OR has_function_privilege('anon','public.owner_complete_manual_admin_password_reset(uuid,boolean,text)','EXECUTE') THEN
    RAISE EXCEPTION 'anonymous_manual_admin_provisioning_must_be_denied';
  END IF;

  IF NOT has_function_privilege('authenticated','public.owner_reserve_manual_admin_provisioning(uuid,text,boolean,text,text)','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.owner_complete_manual_admin_provisioning(uuid,uuid)','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.owner_reserve_manual_admin_password_reset(uuid,text,text)','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.owner_complete_manual_admin_password_reset(uuid,boolean,text)','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.record_manual_admin_password_change()','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.mdi_manual_password_change_required()','EXECUTE') THEN
    RAISE EXCEPTION 'authenticated_owner_workflow_or_password_gate_grants_missing';
  END IF;

  IF has_function_privilege('anon','private.can_use_mdi_tenant_features()','EXECUTE')
     OR has_function_privilege('authenticated','private.can_use_mdi_tenant_features()','EXECUTE') THEN
    RAISE EXCEPTION 'internal_password_gate_helper_must_not_be_directly_callable';
  END IF;

  IF NOT has_function_privilege('authenticated','private.get_auth_tenant_ids()','EXECUTE')
     OR NOT has_function_privilege('authenticated','private.has_tenant_role(uuid,public.user_role[])','EXECUTE') THEN
    RAISE EXCEPTION 'existing_rls_helper_grants_must_be_preserved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tenants'
      AND column_name='contact_email_verified'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tenants'
      AND column_name='manual_admin_provisioned'
  ) THEN
    RAISE EXCEPTION 'manual_tenant_verification_flags_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='private' AND table_name='manual_admin_provisionings'
      AND column_name='contact_verification_note'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='private' AND table_name='manual_admin_provisionings'
      AND column_name='contact_verified_at'
  ) THEN
    RAISE EXCEPTION 'manual_provisioning_contact_attestation_columns_missing';
  END IF;

  IF to_regprocedure('public.owner_provision_manual_madrasa_admin(uuid,uuid,boolean,text)') IS NOT NULL
     OR to_regprocedure('public.owner_prepare_manual_admin_recovery(uuid,text,text)') IS NOT NULL
     OR to_regprocedure('public.owner_finalize_manual_admin_recovery(uuid,uuid,text,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'superseded_one_step_manual_admin_rpcs_must_be_removed';
  END IF;
END;
$$;

SELECT 'manual_admin_activation_security_smoke_checks_passed' AS result;
