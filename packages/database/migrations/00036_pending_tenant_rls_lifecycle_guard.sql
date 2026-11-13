-- MDI 00036: enforce tenant activation boundaries inside PostgreSQL RLS.
-- Pending tenants may read their own onboarding configuration and write it only
-- until onboarding completion. All operational tenant data requires active status.

CREATE OR REPLACE FUNCTION public.has_tenant_onboarding_access(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users tu
    JOIN public.tenants t ON t.id=tu.tenant_id
    WHERE tu.tenant_id=target_tenant_id
      AND tu.user_id=(SELECT auth.uid())
      AND tu.role='madrasa_admin'::public.user_role
      AND tu.is_active=TRUE
      AND t.platform_status='pending_activation'
      AND t.is_active=FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_onboarding_write(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users tu
    JOIN public.tenants t ON t.id=tu.tenant_id
    WHERE tu.tenant_id=target_tenant_id
      AND tu.user_id=(SELECT auth.uid())
      AND tu.role='madrasa_admin'::public.user_role
      AND tu.is_active=TRUE
      AND t.platform_status='pending_activation'
      AND t.is_active=FALSE
      AND t.onboarding_completed_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.has_tenant_onboarding_access(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_tenant_onboarding_write(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_tenant_onboarding_access(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_onboarding_write(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_auth_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT tu.tenant_id
  FROM public.tenant_users tu
  JOIN public.tenants t ON t.id=tu.tenant_id
  WHERE tu.user_id=(SELECT auth.uid())
    AND tu.is_active=TRUE
    AND tu.role <> 'super_admin'::public.user_role
    AND t.is_active=TRUE
    AND t.platform_status='active';
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(
  target_tenant_id UUID,
  required_roles public.user_role[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users tu
    JOIN public.tenants t ON t.id=tu.tenant_id
    WHERE tu.tenant_id=target_tenant_id
      AND tu.user_id=(SELECT auth.uid())
      AND tu.role <> 'super_admin'::public.user_role
      AND tu.role = ANY(array_remove(required_roles,'super_admin'::public.user_role))
      AND tu.is_active=TRUE
      AND t.is_active=TRUE
      AND t.platform_status='active'
  );
$$;

-- Membership lookup remains available to the signed-in member so the
-- onboarding context can resolve a pending tenant without exposing other users.
DROP POLICY IF EXISTS "Users can view their own tenant membership" ON public.tenant_users;
CREATE POLICY "Users can view their own tenant membership"
ON public.tenant_users FOR SELECT TO authenticated
USING (user_id=(SELECT auth.uid()));

-- Tenant identity and configuration are the only tenant rows exposed before activation.
DROP POLICY IF EXISTS "Tenants are viewable by tenant members" ON public.tenants;
CREATE POLICY "Tenants are viewable by tenant members"
ON public.tenants FOR SELECT TO public
USING (
  id IN (SELECT public.get_auth_tenant_ids())
  OR public.has_tenant_onboarding_access(id)
);

DROP POLICY IF EXISTS "Public tenants are viewable" ON public.tenants;
CREATE POLICY "Public tenants are viewable"
ON public.tenants FOR SELECT TO public
USING (is_active=TRUE AND platform_status='active');

DROP POLICY IF EXISTS "Admins can update tenant settings" ON public.tenants;
CREATE POLICY "Admins can update tenant settings"
ON public.tenants FOR UPDATE TO authenticated
USING (
  public.has_tenant_role(id,ARRAY['madrasa_admin'::public.user_role])
  OR public.has_tenant_onboarding_write(id)
)
WITH CHECK (
  public.has_tenant_role(id,ARRAY['madrasa_admin'::public.user_role])
  OR public.has_tenant_onboarding_write(id)
);

-- Onboarding configuration tables: pending Madrasa Admin gets read access,
-- but writes stop as soon as onboarding_completed_at is set.
DROP POLICY IF EXISTS "Branches are viewable by tenant members" ON public.branches;
CREATE POLICY "Branches are viewable by tenant members"
ON public.branches FOR SELECT TO public
USING (
  tenant_id IN (SELECT public.get_auth_tenant_ids())
  OR public.has_tenant_onboarding_access(tenant_id)
);

DROP POLICY IF EXISTS "Admins can manage branches" ON public.branches;
CREATE POLICY "Admins can manage branches"
ON public.branches FOR ALL TO authenticated
USING (
  public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role])
  OR public.has_tenant_onboarding_write(tenant_id)
)
WITH CHECK (
  public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role])
  OR public.has_tenant_onboarding_write(tenant_id)
);

DROP POLICY IF EXISTS "Academic years viewable by tenant members" ON public.academic_years;
CREATE POLICY "Academic years viewable by tenant members"
ON public.academic_years FOR SELECT TO public
USING (
  tenant_id IN (SELECT public.get_auth_tenant_ids())
  OR public.has_tenant_onboarding_access(tenant_id)
);

DROP POLICY IF EXISTS "Academic admins can manage academic years" ON public.academic_years;
CREATE POLICY "Academic admins can manage academic years"
ON public.academic_years FOR ALL TO authenticated
USING (
  public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role,'academic_dean'::public.user_role])
  OR public.has_tenant_onboarding_write(tenant_id)
)
WITH CHECK (
  public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role,'academic_dean'::public.user_role])
  OR public.has_tenant_onboarding_write(tenant_id)
);

DROP POLICY IF EXISTS "Departments viewable by tenant members" ON public.departments;
CREATE POLICY "Departments viewable by tenant members"
ON public.departments FOR SELECT TO public
USING (
  tenant_id IN (SELECT public.get_auth_tenant_ids())
  OR public.has_tenant_onboarding_access(tenant_id)
);

DROP POLICY IF EXISTS "Academic admins can manage departments" ON public.departments;
CREATE POLICY "Academic admins can manage departments"
ON public.departments FOR ALL TO authenticated
USING (
  public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role,'academic_dean'::public.user_role])
  OR public.has_tenant_onboarding_write(tenant_id)
)
WITH CHECK (
  public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role,'academic_dean'::public.user_role])
  OR public.has_tenant_onboarding_write(tenant_id)
);

DROP POLICY IF EXISTS "Classes viewable by tenant members" ON public.classes;
CREATE POLICY "Classes viewable by tenant members"
ON public.classes FOR SELECT TO public
USING (
  tenant_id IN (SELECT public.get_auth_tenant_ids())
  OR public.has_tenant_onboarding_access(tenant_id)
);

DROP POLICY IF EXISTS "Academic admins can manage classes" ON public.classes;
CREATE POLICY "Academic admins can manage classes"
ON public.classes FOR ALL TO authenticated
USING (
  public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role,'academic_dean'::public.user_role])
  OR public.has_tenant_onboarding_write(tenant_id)
)
WITH CHECK (
  public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role,'academic_dean'::public.user_role])
  OR public.has_tenant_onboarding_write(tenant_id)
);

-- Onboarding audit events may be appended before activation; read access to
-- tenant audit history remains limited to active tenant administrators.
DROP POLICY IF EXISTS "Audit logs insertable by members" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by members"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT public.get_auth_tenant_ids())
  OR public.has_tenant_onboarding_write(tenant_id)
);

-- Public tenant content and public admission applications must belong to an
-- active tenant; a pending or suspended tenant cannot publish externally.
DROP POLICY IF EXISTS "Public notices viewable by anyone or members" ON public.tenant_notices;
CREATE POLICY "Public notices viewable by anyone or members"
ON public.tenant_notices FOR SELECT TO public
USING (
  (
    is_public=TRUE
    AND EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id=tenant_id AND t.is_active=TRUE AND t.platform_status='active'
    )
  )
  OR tenant_id IN (SELECT public.get_auth_tenant_ids())
);

DROP POLICY IF EXISTS "Public pages viewable by anyone" ON public.tenant_pages;
CREATE POLICY "Public pages viewable by anyone"
ON public.tenant_pages FOR SELECT TO public
USING (
  (
    is_published=TRUE
    AND EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id=tenant_id AND t.is_active=TRUE AND t.platform_status='active'
    )
  )
  OR tenant_id IN (SELECT public.get_auth_tenant_ids())
);

DROP POLICY IF EXISTS "Public admission application submission" ON public.student_admissions;
CREATE POLICY "Public admission application submission"
ON public.student_admissions FOR INSERT TO public
WITH CHECK (
  status='applied'::public.admission_status
  AND EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id=tenant_id AND t.is_active=TRUE AND t.platform_status='active'
  )
);

-- The final two onboarding RPCs must use the narrowly-scoped onboarding
-- authorization rather than the active-tenant operational role helper.
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
  IF auth.uid() IS NULL OR NOT public.has_tenant_onboarding_write(p_tenant_id) THEN
    RAISE EXCEPTION 'madrasa_admin_required' USING ERRCODE='42501';
  END IF;
  IF jsonb_typeof(p_leadership)<>'object' THEN RAISE EXCEPTION 'invalid_leadership_payload'; END IF;

  v_clean:=jsonb_build_object(
    'deanName',NULLIF(left(btrim(COALESCE(p_leadership->>'deanName','')),160),''),
    'deanPhone',NULLIF(left(btrim(COALESCE(p_leadership->>'deanPhone','')),32),''),
    'bursarName',NULLIF(left(btrim(COALESCE(p_leadership->>'bursarName','')),160),''),
    'bursarPhone',NULLIF(left(btrim(COALESCE(p_leadership->>'bursarPhone','')),32),'')
  );

  SELECT * INTO v_tenant FROM public.tenants WHERE id=p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tenant_not_found'; END IF;
  IF v_tenant.onboarding_step<>5 OR v_tenant.onboarding_completed_at IS NOT NULL THEN
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
  IF auth.uid() IS NULL OR NOT public.has_tenant_onboarding_access(p_tenant_id) THEN
    RAISE EXCEPTION 'madrasa_admin_required' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id=p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tenant_not_found'; END IF;
  IF v_tenant.source_application_id IS NULL THEN
    RAISE EXCEPTION 'tenant_not_created_from_approved_application';
  END IF;
  IF v_tenant.platform_status<>'pending_activation' OR v_tenant.is_active=TRUE THEN
    RAISE EXCEPTION 'tenant_not_in_onboarding_state';
  END IF;
  IF v_tenant.onboarding_completed_at IS NOT NULL THEN RETURN TRUE; END IF;
  IF NOT public.has_tenant_onboarding_write(p_tenant_id) THEN
    RAISE EXCEPTION 'onboarding_write_closed';
  END IF;
  IF v_tenant.onboarding_step<>6 THEN RAISE EXCEPTION 'onboarding_steps_incomplete'; END IF;
  IF v_tenant.program_policies->'leadership' IS NULL THEN RAISE EXCEPTION 'leadership_step_incomplete'; END IF;

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
      onboarding_completed_at=now(),
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

COMMENT ON FUNCTION public.get_auth_tenant_ids() IS
  'Returns only active tenant memberships. Pending activation tenant onboarding is handled by narrowly scoped onboarding policies.';
COMMENT ON FUNCTION public.has_tenant_onboarding_write(UUID) IS
  'Allows only the tenant Madrasa Admin to write onboarding configuration before onboarding completion; no operational table access is granted.';
