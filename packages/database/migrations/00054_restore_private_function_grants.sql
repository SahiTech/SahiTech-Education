
-- Restore the private-schema least-privilege baseline after migration 00053.
-- Only auth.uid()-scoped RLS helpers and the explicit teacher assignment predicates
-- are callable by application roles. Trigger implementations remain non-callable.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.get_auth_tenant_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_tenant_onboarding_access(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_tenant_onboarding_write(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_tenant_role(uuid, public.user_role[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.can_upload_madrasa_application_document(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_platform_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_platform_owner_identity() TO authenticated;

GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_section(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_current_section(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_current_class(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_current_subject(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_exam_mark(uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_routine(uuid, uuid, uuid, uuid) TO authenticated;
