-- MDI 00037: index uncovered foreign keys and avoid per-row auth.uid() evaluation in profile policies.
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx
  ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_tenant_id_idx
  ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS communication_logs_tenant_id_idx
  ON public.communication_logs(tenant_id);
CREATE INDEX IF NOT EXISTS journal_entries_posted_by_idx
  ON public.journal_entries(posted_by);
CREATE INDEX IF NOT EXISTS lillah_evaluations_evaluator_user_id_idx
  ON public.lillah_evaluations(evaluator_user_id);
CREATE INDEX IF NOT EXISTS madrasa_application_documents_reviewed_by_idx
  ON public.madrasa_application_documents(reviewed_by);
CREATE INDEX IF NOT EXISTS madrasa_applications_reviewed_by_idx
  ON public.madrasa_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS platform_audit_logs_actor_user_id_idx
  ON public.platform_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS platform_invitations_created_by_idx
  ON public.platform_invitations(created_by);
CREATE INDEX IF NOT EXISTS staff_leaves_approved_by_idx
  ON public.staff_leaves(approved_by);
CREATE INDEX IF NOT EXISTS students_user_id_idx
  ON public.students(user_id);
CREATE INDEX IF NOT EXISTS teachers_user_id_idx
  ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS tenant_notices_tenant_id_idx
  ON public.tenant_notices(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_users_user_id_idx
  ON public.tenant_users(user_id);

DROP POLICY IF EXISTS "Profiles viewable by self or tenant co-members" ON public.profiles;
CREATE POLICY "Profiles viewable by self or tenant co-members"
ON public.profiles FOR SELECT TO authenticated
USING (
  id=(SELECT auth.uid())
  OR id IN (
    SELECT tu.user_id
    FROM public.tenant_users tu
    WHERE tu.tenant_id IN (SELECT public.get_auth_tenant_ids())
  )
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id=(SELECT auth.uid()))
WITH CHECK (id=(SELECT auth.uid()));

COMMENT ON INDEX public.tenant_users_user_id_idx IS
  'Supports user-to-tenant membership lookup used by authentication and tenant context resolution.';
