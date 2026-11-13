-- MDI 00032: align onboarding validation with the actual branches schema.
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

  SELECT * INTO v_tenant
  FROM public.tenants
  WHERE id=p_tenant_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tenant_not_found'; END IF;
  IF v_tenant.source_application_id IS NULL THEN
    RAISE EXCEPTION 'tenant_not_created_from_approved_application';
  END IF;
  IF v_tenant.platform_status NOT IN ('provisioning','pending_activation') THEN
    RAISE EXCEPTION 'tenant_not_in_onboarding_state';
  END IF;

  SELECT count(*) INTO v_branches
  FROM public.branches
  WHERE tenant_id=p_tenant_id AND is_main_branch=TRUE;
  SELECT count(*) INTO v_years
  FROM public.academic_years
  WHERE tenant_id=p_tenant_id;
  SELECT count(*) INTO v_departments
  FROM public.departments
  WHERE tenant_id=p_tenant_id;

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
