-- MDI 00023: append-only platform audit trail for privileged lifecycle events.
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_aal TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  tenant_id UUID,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_audit_logs_created_at_idx
  ON public.platform_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_logs_entity_idx
  ON public.platform_audit_logs(entity_type,entity_id,created_at DESC);

ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.platform_audit_logs TO authenticated;

CREATE POLICY "Global owner can read platform audit log"
ON public.platform_audit_logs
FOR SELECT TO authenticated
USING ((SELECT private.is_platform_owner()));

CREATE OR REPLACE FUNCTION private.reject_platform_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'platform_audit_log_is_append_only' USING ERRCODE='42501';
END;
$$;
REVOKE ALL ON FUNCTION private.reject_platform_audit_mutation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS platform_audit_logs_immutable ON public.platform_audit_logs;
CREATE TRIGGER platform_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.platform_audit_logs
FOR EACH ROW EXECUTE FUNCTION private.reject_platform_audit_mutation();

CREATE OR REPLACE FUNCTION private.capture_platform_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_action TEXT;
  v_entity_type TEXT;
  v_entity_id UUID;
  v_tenant_id UUID;
  v_before JSONB;
  v_after JSONB;
BEGIN
  IF TG_TABLE_NAME='platform_owner' THEN
    IF TG_OP='UPDATE' AND OLD.auth_user_id IS NULL AND NEW.auth_user_id IS NOT NULL THEN
      v_action := 'platform_owner.bound';
      v_entity_type := 'platform_owner';
      v_entity_id := NEW.auth_user_id;
      v_after := jsonb_build_object('owner_email',NEW.owner_email,'auth_user_id',NEW.auth_user_id);
    END IF;

  ELSIF TG_TABLE_NAME='madrasa_applications' THEN
    v_entity_type := 'madrasa_application';
    v_entity_id := COALESCE(NEW.id,OLD.id);
    IF TG_OP='INSERT' THEN
      v_action := 'application.submitted';
      v_after := jsonb_build_object('status',NEW.status,'institution_type',NEW.institution_type);
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'application.status_changed';
      v_before := jsonb_build_object('status',OLD.status,'review_note',OLD.review_note);
      v_after := jsonb_build_object('status',NEW.status,'review_note',NEW.review_note,'reviewed_by',NEW.reviewed_by);
    END IF;

  ELSIF TG_TABLE_NAME='madrasa_application_documents' THEN
    v_action := 'application.document_uploaded';
    v_entity_type := 'madrasa_application';
    v_entity_id := NEW.application_id;
    v_after := jsonb_build_object('document_id',NEW.id,'document_type',NEW.document_type,'mime_type',NEW.mime_type,'file_size_bytes',NEW.file_size_bytes);

  ELSIF TG_TABLE_NAME='platform_invitations' THEN
    v_entity_type := 'platform_invitation';
    v_entity_id := COALESCE(NEW.id,OLD.id);
    IF TG_OP='INSERT' THEN
      v_action := 'invitation.created';
      v_tenant_id := NULL;
      v_after := jsonb_build_object('application_id',NEW.application_id,'invitee_email',NEW.invitee_email,'status',NEW.status,'expires_at',NEW.expires_at);
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'invitation.status_changed';
      v_before := jsonb_build_object('status',OLD.status);
      v_after := jsonb_build_object('status',NEW.status,'application_id',NEW.application_id);
    END IF;

  ELSIF TG_TABLE_NAME='tenants' THEN
    v_entity_type := 'tenant';
    v_entity_id := NEW.id;
    v_tenant_id := NEW.id;
    IF TG_OP='INSERT' AND NEW.source_application_id IS NOT NULL THEN
      v_action := 'tenant.provisioned';
      v_after := jsonb_build_object('platform_status',NEW.platform_status,'is_active',NEW.is_active,'source_application_id',NEW.source_application_id);
    ELSIF TG_OP='UPDATE' AND ROW(NEW.is_active,NEW.is_verified,NEW.platform_status,NEW.onboarding_completed_at)
      IS DISTINCT FROM ROW(OLD.is_active,OLD.is_verified,OLD.platform_status,OLD.onboarding_completed_at) THEN
      v_action := 'tenant.lifecycle_changed';
      v_before := jsonb_build_object('is_active',OLD.is_active,'is_verified',OLD.is_verified,'platform_status',OLD.platform_status,'onboarding_completed_at',OLD.onboarding_completed_at);
      v_after := jsonb_build_object('is_active',NEW.is_active,'is_verified',NEW.is_verified,'platform_status',NEW.platform_status,'onboarding_completed_at',NEW.onboarding_completed_at);
    END IF;

  ELSIF TG_TABLE_NAME='tenant_users' THEN
    IF TG_OP='INSERT' AND NEW.role='madrasa_admin'::public.user_role THEN
      IF EXISTS (SELECT 1 FROM public.tenants WHERE id=NEW.tenant_id AND source_application_id IS NOT NULL) THEN
        v_action := 'tenant.initial_admin_assigned';
        v_entity_type := 'tenant';
        v_entity_id := NEW.tenant_id;
        v_tenant_id := NEW.tenant_id;
        v_after := jsonb_build_object('user_id',NEW.user_id,'role',NEW.role,'branch_id',NEW.branch_id);
      END IF;
    END IF;
  END IF;

  IF v_action IS NOT NULL THEN
    INSERT INTO public.platform_audit_logs(
      actor_user_id,actor_aal,action,entity_type,entity_id,tenant_id,before_state,after_state
    ) VALUES (
      auth.uid(),auth.jwt()->>'aal',v_action,v_entity_type,v_entity_id,v_tenant_id,v_before,v_after
    );
  END IF;
  RETURN COALESCE(NEW,OLD);
END;
$$;
REVOKE ALL ON FUNCTION private.capture_platform_audit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_platform_owner_binding ON private.platform_owner;
CREATE TRIGGER audit_platform_owner_binding
AFTER UPDATE OF auth_user_id ON private.platform_owner
FOR EACH ROW EXECUTE FUNCTION private.capture_platform_audit();

DROP TRIGGER IF EXISTS audit_madrasa_applications ON public.madrasa_applications;
CREATE TRIGGER audit_madrasa_applications
AFTER INSERT OR UPDATE ON public.madrasa_applications
FOR EACH ROW EXECUTE FUNCTION private.capture_platform_audit();

DROP TRIGGER IF EXISTS audit_application_documents ON public.madrasa_application_documents;
CREATE TRIGGER audit_application_documents
AFTER INSERT ON public.madrasa_application_documents
FOR EACH ROW EXECUTE FUNCTION private.capture_platform_audit();

DROP TRIGGER IF EXISTS audit_platform_invitations ON public.platform_invitations;
CREATE TRIGGER audit_platform_invitations
AFTER INSERT OR UPDATE ON public.platform_invitations
FOR EACH ROW EXECUTE FUNCTION private.capture_platform_audit();

DROP TRIGGER IF EXISTS audit_tenant_lifecycle ON public.tenants;
CREATE TRIGGER audit_tenant_lifecycle
AFTER INSERT OR UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION private.capture_platform_audit();

DROP TRIGGER IF EXISTS audit_tenant_initial_admin ON public.tenant_users;
CREATE TRIGGER audit_tenant_initial_admin
AFTER INSERT ON public.tenant_users
FOR EACH ROW EXECUTE FUNCTION private.capture_platform_audit();

COMMENT ON TABLE public.platform_audit_logs IS
  'Append-only Global Platform Owner audit trail. Readable only by the singleton owner with AAL2; writes are generated by database triggers.';
