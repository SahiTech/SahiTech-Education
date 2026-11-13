-- MDI 00021: prevent owner review edits after invitation acceptance or tenant provisioning.
CREATE OR REPLACE FUNCTION public.owner_update_application_status(
  p_application_id UUID,
  p_status TEXT,
  p_review_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE='42501';
  END IF;
  IF p_status NOT IN ('under_review','info_requested','rejected') THEN
    RAISE EXCEPTION 'invalid_application_status';
  END IF;

  PERFORM 1 FROM public.madrasa_applications WHERE id=p_application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'application_not_found'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.platform_invitations
    WHERE application_id=p_application_id AND status='accepted'
  ) OR EXISTS (
    SELECT 1 FROM public.tenants WHERE source_application_id=p_application_id
  ) THEN
    RAISE EXCEPTION 'application_already_accepted_or_provisioned';
  END IF;

  UPDATE public.madrasa_applications
    SET status=p_status,
        review_note=NULLIF(left(btrim(COALESCE(p_review_note,'')),2000),''),
        reviewed_by=v_owner,
        reviewed_at=now(),
        updated_at=now()
    WHERE id=p_application_id;

  UPDATE public.platform_invitations
    SET status='revoked',revoked_at=now()
    WHERE application_id=p_application_id AND status IN ('pending','sent');

  UPDATE public.email_outbox
    SET status='cancelled',last_error='Application review status changed by Global Platform Owner'
    WHERE status IN ('queued','failed','processing')
      AND payload->>'application_id'=p_application_id::TEXT;

  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.owner_update_application_status(UUID,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_update_application_status(UUID,TEXT,TEXT) TO authenticated;
