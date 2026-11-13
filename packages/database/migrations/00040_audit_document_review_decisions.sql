-- MDI 00040: append a dedicated audit event for every application-document review decision.
CREATE OR REPLACE FUNCTION private.capture_application_document_review_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
BEGIN
  IF ROW(NEW.verification_status,NEW.reviewed_by,NEW.review_note)
     IS DISTINCT FROM
     ROW(OLD.verification_status,OLD.reviewed_by,OLD.review_note) THEN
    INSERT INTO public.platform_audit_logs(
      actor_user_id,actor_aal,action,entity_type,entity_id,tenant_id,before_state,after_state
    ) VALUES (
      auth.uid(),
      auth.jwt()->>'aal',
      'application.document_reviewed',
      'madrasa_application',
      NEW.application_id,
      NULL,
      jsonb_build_object(
        'document_id',NEW.id,
        'verification_status',OLD.verification_status,
        'review_note',OLD.review_note
      ),
      jsonb_build_object(
        'document_id',NEW.id,
        'verification_status',NEW.verification_status,
        'reviewed_by',NEW.reviewed_by,
        'review_note',NEW.review_note
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.capture_application_document_review_audit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_application_document_review ON public.madrasa_application_documents;
CREATE TRIGGER audit_application_document_review
AFTER UPDATE ON public.madrasa_application_documents
FOR EACH ROW
EXECUTE FUNCTION private.capture_application_document_review_audit();

COMMENT ON FUNCTION private.capture_application_document_review_audit() IS
  'Appends a minimal, immutable platform audit event when the Global Platform Owner verifies or rejects an application document.';
