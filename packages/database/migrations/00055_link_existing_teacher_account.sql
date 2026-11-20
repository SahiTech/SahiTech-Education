-- MDI 00055: atomically link an existing verified login to a tenant teacher record.
CREATE OR REPLACE FUNCTION public.admin_link_teacher_account(
  p_tenant_id UUID,
  p_teacher_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, private, pg_temp
AS $$
DECLARE
  v_teacher public.teachers%ROWTYPE;
  v_existing_role public.user_role;
BEGIN
  IF auth.uid() IS NULL
     OR NOT public.has_tenant_role(p_tenant_id, ARRAY['madrasa_admin'::public.user_role]) THEN
    RAISE EXCEPTION 'madrasa_admin_required' USING ERRCODE='42501';
  END IF;

  IF p_tenant_id IS NULL OR p_teacher_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_teacher_account_link';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=p_user_id) THEN
    RAISE EXCEPTION 'verified_user_profile_required';
  END IF;

  SELECT * INTO v_teacher
  FROM public.teachers
  WHERE id=p_teacher_id AND tenant_id=p_tenant_id
  FOR UPDATE;

  IF NOT FOUND OR v_teacher.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'active_teacher_not_found';
  END IF;

  IF v_teacher.user_id IS NOT NULL AND v_teacher.user_id <> p_user_id THEN
    RAISE EXCEPTION 'teacher_already_linked';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.teachers
    WHERE tenant_id=p_tenant_id AND user_id=p_user_id AND id<>p_teacher_id
  ) THEN
    RAISE EXCEPTION 'user_already_linked_to_another_teacher';
  END IF;

  SELECT role INTO v_existing_role
  FROM public.tenant_users
  WHERE tenant_id=p_tenant_id AND user_id=p_user_id
  FOR UPDATE;

  IF FOUND AND v_existing_role <> 'teacher'::public.user_role THEN
    RAISE EXCEPTION 'user_has_conflicting_tenant_role';
  END IF;

  UPDATE public.teachers
  SET user_id=p_user_id, updated_at=now()
  WHERE id=p_teacher_id AND tenant_id=p_tenant_id;

  INSERT INTO public.tenant_users(tenant_id,user_id,role,is_active)
  VALUES(p_tenant_id,p_user_id,'teacher'::public.user_role,TRUE)
  ON CONFLICT (tenant_id,user_id)
  DO UPDATE SET is_active=TRUE, updated_at=now()
  WHERE public.tenant_users.role='teacher'::public.user_role;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_link_teacher_account(UUID,UUID,UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_link_teacher_account(UUID,UUID,UUID) TO authenticated;
COMMENT ON FUNCTION public.admin_link_teacher_account(UUID,UUID,UUID) IS
  'Madrasa Admin-only atomic link of an existing profile to one active teacher record and teacher tenant membership.';
