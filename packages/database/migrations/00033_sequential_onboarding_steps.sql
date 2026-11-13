-- MDI 00033: require sequential onboarding and save the leadership step through a validated RPC.
CREATE OR REPLACE FUNCTION private.guard_tenant_platform_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
DECLARE
  v_platform_fields_changed BOOLEAN;
  v_onboarding_completion_changed BOOLEAN;
BEGIN
  IF private.is_platform_owner() OR current_user='postgres' THEN
    RETURN NEW;
  END IF;

  v_platform_fields_changed :=
    ROW(NEW.is_active,NEW.is_verified,NEW.platform_status,NEW.source_application_id)
    IS DISTINCT FROM
    ROW(OLD.is_active,OLD.is_verified,OLD.platform_status,OLD.source_application_id);

  v_onboarding_completion_changed :=
    NEW.onboarding_completed_at IS DISTINCT FROM OLD.onboarding_completed_at
    OR (NEW.onboarding_step=6 AND OLD.onboarding_step IS DISTINCT FROM 6);

  IF v_onboarding_completion_changed THEN
    RAISE EXCEPTION 'onboarding_completion_must_use_validated_rpc' USING ERRCODE='42501';
  END IF;

  IF NEW.onboarding_step IS DISTINCT FROM OLD.onboarding_step THEN
    IF NEW.onboarding_step <> OLD.onboarding_step + 1 OR NEW.onboarding_step >= 6 THEN
      RAISE EXCEPTION 'onboarding_steps_must_be_completed_sequentially' USING ERRCODE='42501';
    END IF;
  END IF;

  IF v_platform_fields_changed THEN
    IF NEW.is_active=FALSE
       AND NEW.is_verified=FALSE
       AND NEW.platform_status='pending_activation'
       AND NEW.source_application_id IS NOT DISTINCT FROM OLD.source_application_id THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'platform_tenant_lifecycle_is_owner_managed' USING ERRCODE='42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_onboarding_leadership(
  p_tenant_id UUID,
  p_leadership JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_clean JSONB;
BEGIN
  IF auth.uid() IS NULL
     OR NOT public.has_tenant_role(p_tenant_id,ARRAY['madrasa_admin'::public.user_role]) THEN
    RAISE EXCEPTION 'madrasa_admin_required' USING ERRCODE='42501';
  END IF;
  IF jsonb_typeof(p_leadership) <> 'object' THEN
    RAISE EXCEPTION 'invalid_leadership_payload';
  END IF;

  v_clean := jsonb_build_object(
    'deanName',NULLIF(left(btrim(COALESCE(p_leadership->>'deanName','')),160),''),
    'deanPhone',NULLIF(left(btrim(COALESCE(p_leadership->>'deanPhone','')),32),''),
    'bursarName',NULLIF(left(btrim(COALESCE(p_leadership->>'bursarName','')),160),''),
    'bursarPhone',NULLIF(left(btrim(COALESCE(p_leadership->>'bursarPhone','')),32),'')
  );

  SELECT * INTO v_tenant FROM public.tenants WHERE id=p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tenant_not_found'; END IF;
  IF v_tenant.onboarding_step <> 5 THEN
    RAISE EXCEPTION 'onboarding_step_5_required';
  END IF;

  UPDATE public.tenants
  SET program_policies=jsonb_set(COALESCE(program_policies,'{}'::jsonb),'{leadership}',v_clean,TRUE),
      onboarding_step=6,
      updated_at=now()
  WHERE id=p_tenant_id;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.save_onboarding_leadership(UUID,JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_onboarding_leadership(UUID,JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_tenant_onboarding(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_branches INTEGER;
  v_years INTEGER;
  v_departments INTEGER;
BEGIN
  IF auth.uid() IS NULL
     OR NOT public.has_tenant_role(p_tenant_id,ARRAY['madrasa_admin'::public.user_role]) THEN
    RAISE EXCEPTION 'madrasa_admin_required' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id=p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tenant_not_found'; END IF;
  IF v_tenant.source_application_id IS NULL THEN
    RAISE EXCEPTION 'tenant_not_created_from_approved_application';
  END IF;
  IF v_tenant.platform_status NOT IN ('provisioning','pending_activation') THEN
    RAISE EXCEPTION 'tenant_not_in_onboarding_state';
  END IF;
  IF v_tenant.onboarding_step <> 6 OR v_tenant.onboarding_completed_at IS NOT NULL
     AND v_tenant.onboarding_step <> 6 THEN
    RAISE EXCEPTION 'onboarding_steps_incomplete';
  END IF;
  IF v_tenant.program_policies->'leadership' IS NULL THEN
    RAISE EXCEPTION 'leadership_step_incomplete';
  END IF;

  SELECT count(*) INTO v_branches FROM public.branches WHERE tenant_id=p_tenant_id AND is_main_branch=TRUE;
  SELECT count(*) INTO v_years FROM public.academic_years WHERE tenant_id=p_tenant_id;
  SELECT count(*) INTO v_departments FROM public.departments WHERE tenant_id=p_tenant_id;

  IF v_tenant.name IS NULL OR btrim(v_tenant.name)='' OR v_tenant.code IS NULL OR btrim(v_tenant.code)='' THEN
    RAISE EXCEPTION 'institution_profile_incomplete';
  END IF;
  IF v_branches=0 THEN RAISE EXCEPTION 'main_branch_missing'; END IF;
  IF v_years=0 THEN RAISE EXCEPTION 'academic_year_missing'; END IF;
  IF v_departments=0 THEN RAISE EXCEPTION 'departments_missing'; END IF;

  UPDATE public.tenants
  SET onboarding_step=6,
      onboarding_completed_at=COALESCE(onboarding_completed_at,now()),
      is_verified=FALSE,
      is_active=FALSE,
      platform_status='pending_activation',
      updated_at=now()
  WHERE id=p_tenant_id;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_tenant_onboarding(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_tenant_onboarding(UUID) TO authenticated;
