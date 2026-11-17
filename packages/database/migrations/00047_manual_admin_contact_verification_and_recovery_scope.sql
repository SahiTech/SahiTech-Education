-- MDI 00047: require out-of-band contact verification at provisioning and restrict recovery
-- to MDI-created manual admin identities. Forward-only; no Auth password material is stored.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS contact_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manual_admin_provisioned BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE private.manual_admin_provisionings
  ADD COLUMN IF NOT EXISTS contact_verification_method TEXT,
  ADD COLUMN IF NOT EXISTS contact_verification_note TEXT,
  ADD COLUMN IF NOT EXISTS contact_verified_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='private.manual_admin_provisionings'::regclass
      AND conname='manual_admin_provisionings_contact_method_check'
  ) THEN
    ALTER TABLE private.manual_admin_provisionings
      ADD CONSTRAINT manual_admin_provisionings_contact_method_check
      CHECK (
        contact_verification_method IS NULL
        OR contact_verification_method IN ('phone_call','whatsapp','in_person','signed_authorization')
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='private.manual_admin_provisionings'::regclass
      AND conname='manual_admin_provisionings_contact_note_check'
  ) THEN
    ALTER TABLE private.manual_admin_provisionings
      ADD CONSTRAINT manual_admin_provisionings_contact_note_check
      CHECK (
        contact_verification_note IS NULL
        OR length(btrim(contact_verification_note)) BETWEEN 20 AND 500
      );
  END IF;
END;
$$;

-- Remove unused one-step RPCs from the earlier 00045 implementation. The active
-- application path uses the reservation/finalization workflow from 00046 only.
DROP FUNCTION IF EXISTS public.owner_provision_manual_madrasa_admin(UUID, UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.owner_prepare_manual_admin_recovery(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.owner_finalize_manual_admin_recovery(UUID, UUID, TEXT, TEXT);

DROP FUNCTION IF EXISTS public.owner_reserve_manual_admin_provisioning(UUID, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.owner_reserve_manual_admin_provisioning(
  p_application_id UUID,
  p_login_identifier TEXT,
  p_activate_immediately BOOLEAN DEFAULT TRUE,
  p_contact_verification_method TEXT DEFAULT NULL,
  p_contact_verification_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, extensions, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_app public.madrasa_applications%ROWTYPE;
  v_res private.manual_admin_provisionings%ROWTYPE;
  v_attempts SMALLINT;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;

  IF p_application_id IS NULL
     OR p_login_identifier !~ '^mdi-[0-9a-f]{32}@login[.]sahitech[.]invalid$' THEN
    RAISE EXCEPTION 'invalid_manual_provisioning_request';
  END IF;

  IF p_contact_verification_method IS NULL
     OR p_contact_verification_method NOT IN ('phone_call','whatsapp','in_person','signed_authorization')
     OR p_contact_verification_note IS NULL
     OR length(btrim(p_contact_verification_note)) NOT BETWEEN 20 AND 500 THEN
    RAISE EXCEPTION 'manual_contact_verification_required';
  END IF;

  SELECT * INTO v_app
  FROM public.madrasa_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND OR v_app.status NOT IN ('pending','under_review','info_requested','approved') THEN
    RAISE EXCEPTION 'application_not_approvable';
  END IF;
  IF v_app.requested_code IS NULL OR v_app.requested_subdomain IS NULL THEN
    RAISE EXCEPTION 'application_missing_tenant_identifiers';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.tenants
    WHERE upper(code)=upper(v_app.requested_code)
       OR lower(COALESCE(subdomain,''))=lower(v_app.requested_subdomain)
  ) THEN
    RAISE EXCEPTION 'tenant_identifier_already_in_use';
  END IF;
  IF EXISTS (SELECT 1 FROM public.tenants WHERE source_application_id=p_application_id) THEN
    RAISE EXCEPTION 'application_already_provisioned';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id=p_application_id AND verification_status='verified'
  ) OR EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id=p_application_id AND verification_status='pending'
  ) THEN
    RAISE EXCEPTION 'application_documents_not_fully_reviewed';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email)=lower(p_login_identifier)) THEN
    RAISE EXCEPTION 'manual_login_identifier_already_exists';
  END IF;

  SELECT * INTO v_res
  FROM private.manual_admin_provisionings
  WHERE application_id=p_application_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_res.status='completed' THEN
      RAISE EXCEPTION 'application_already_provisioned';
    END IF;
    IF v_res.status='reserved' AND v_res.expires_at>now() THEN
      RAISE EXCEPTION 'manual_provisioning_already_in_progress';
    END IF;
    IF v_res.last_attempt_at>now()-interval '24 hours' AND v_res.attempt_count>=3 THEN
      RAISE EXCEPTION 'manual_provisioning_rate_limited';
    END IF;

    v_attempts := CASE
      WHEN v_res.last_attempt_at<=now()-interval '24 hours' THEN 1
      ELSE v_res.attempt_count+1
    END;

    UPDATE private.manual_admin_provisionings
    SET reservation_id=gen_random_uuid(),
        login_identifier=p_login_identifier,
        status='reserved',
        activation_requested=COALESCE(p_activate_immediately,TRUE),
        created_by=v_owner,
        auth_user_id=NULL,
        attempt_count=v_attempts,
        last_attempt_at=now(),
        expires_at=now()+interval '15 minutes',
        completed_at=NULL,
        last_error_code=NULL,
        contact_verification_method=p_contact_verification_method,
        contact_verification_note=btrim(p_contact_verification_note),
        contact_verified_at=now(),
        created_at=now(),
        updated_at=now()
    WHERE application_id=p_application_id
    RETURNING * INTO v_res;
  ELSE
    INSERT INTO private.manual_admin_provisionings(
      application_id,reservation_id,login_identifier,status,activation_requested,
      created_by,attempt_count,last_attempt_at,expires_at,
      contact_verification_method,contact_verification_note,contact_verified_at
    ) VALUES (
      p_application_id,gen_random_uuid(),p_login_identifier,'reserved',
      COALESCE(p_activate_immediately,TRUE),v_owner,1,now(),now()+interval '15 minutes',
      p_contact_verification_method,btrim(p_contact_verification_note),now()
    ) RETURNING * INTO v_res;
  END IF;

  INSERT INTO public.platform_audit_logs(
    actor_user_id,actor_aal,action,entity_type,entity_id,after_state
  ) VALUES (
    v_owner,auth.jwt()->>'aal','tenant.manual_admin_provisioning_reserved',
    'madrasa_application',p_application_id,
    jsonb_build_object(
      'reservation_id',v_res.reservation_id,
      'login_identifier',v_res.login_identifier,
      'verification_method',v_res.contact_verification_method,
      'verification_note',v_res.contact_verification_note,
      'contact_verified_at',v_res.contact_verified_at,
      'activation_requested',v_res.activation_requested
    )
  );

  RETURN jsonb_build_object(
    'reservation_id',v_res.reservation_id,
    'login_identifier',v_res.login_identifier,
    'institution_name',v_app.institution_name,
    'contact_person_name',v_app.contact_person_name,
    'contact_phone',v_app.contact_phone,
    'contact_email',v_app.contact_email,
    'activate_immediately',v_res.activation_requested,
    'contact_email_verified',FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.owner_reserve_manual_admin_provisioning(UUID,TEXT,BOOLEAN,TEXT,TEXT)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_reserve_manual_admin_provisioning(UUID,TEXT,BOOLEAN,TEXT,TEXT)
  TO authenticated;

-- Set explicit tenant-level status flags atomically whenever the reservation
-- workflow inserts the corresponding tenant. Contact email is never verified.
CREATE OR REPLACE FUNCTION private.mark_manual_admin_tenant_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog,public,private,pg_temp
AS $$
BEGIN
  IF NEW.source_application_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM private.manual_admin_provisionings
    WHERE application_id=NEW.source_application_id AND status='reserved'
  ) THEN
    NEW.manual_admin_provisioned := TRUE;
    NEW.contact_email_verified := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.mark_manual_admin_tenant_flags() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS mark_manual_admin_tenant_flags ON public.tenants;
CREATE TRIGGER mark_manual_admin_tenant_flags
BEFORE INSERT ON public.tenants
FOR EACH ROW EXECUTE FUNCTION private.mark_manual_admin_tenant_flags();

-- Password reset must target the exact MDI-created alias stored by the completed
-- manual provisioning reservation. It must never reset an invitation-created
-- or pre-existing tenant administrator.
CREATE OR REPLACE FUNCTION public.owner_reserve_manual_admin_password_reset(
  p_application_id UUID,
  p_verification_method TEXT,
  p_verification_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog,public,private,auth,pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_tenant_id UUID;
  v_institution_name TEXT;
  v_contact_email TEXT;
  v_subdomain TEXT;
  v_is_active BOOLEAN;
  v_user_id UUID;
  v_login_identifier TEXT;
  v_admin_count INTEGER;
  v_request_id UUID;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE='42501';
  END IF;
  IF p_verification_method IS NULL
     OR p_verification_method NOT IN ('phone_call','in_person','signed_authorization')
     OR p_verification_note IS NULL
     OR length(btrim(p_verification_note)) NOT BETWEEN 20 AND 500 THEN
    RAISE EXCEPTION 'manual_recovery_verification_required';
  END IF;

  SELECT id,name,contact_email,subdomain,is_active
  INTO v_tenant_id,v_institution_name,v_contact_email,v_subdomain,v_is_active
  FROM public.tenants
  WHERE source_application_id=p_application_id
    AND manual_admin_provisioned=TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'manual_admin_account_not_found';
  END IF;

  SELECT count(*) INTO v_admin_count
  FROM public.tenant_users
  WHERE tenant_id=v_tenant_id
    AND role='madrasa_admin'::public.user_role
    AND is_active=TRUE;
  IF v_admin_count<>1 THEN
    RAISE EXCEPTION 'manual_recovery_requires_exactly_one_active_madrasa_admin';
  END IF;

  SELECT tu.user_id,u.email
  INTO v_user_id,v_login_identifier
  FROM public.tenant_users tu
  JOIN private.manual_admin_provisionings mp
    ON mp.application_id=p_application_id
   AND mp.auth_user_id=tu.user_id
   AND mp.status='completed'
  JOIN auth.users u ON u.id=tu.user_id
  WHERE tu.tenant_id=v_tenant_id
    AND tu.role='madrasa_admin'::public.user_role
    AND tu.is_active=TRUE
    AND u.email ~ '^mdi-[0-9a-f]{32}@login[.]sahitech[.]invalid$'
    AND COALESCE(u.raw_app_meta_data->>'mdi_manual_madrasa_admin','false')='true'
  LIMIT 1;

  IF v_user_id IS NULL OR v_login_identifier IS NULL THEN
    RAISE EXCEPTION 'manual_admin_auth_identity_not_found';
  END IF;

  IF (
    SELECT count(*) FROM private.manual_admin_password_reset_requests
    WHERE auth_user_id=v_user_id AND created_at>now()-interval '24 hours'
  )>=3 THEN
    RAISE EXCEPTION 'manual_password_reset_rate_limited';
  END IF;

  INSERT INTO private.manual_admin_password_reset_requests(
    application_id,tenant_id,auth_user_id,initiated_by,verification_method,verification_note
  ) VALUES (
    p_application_id,v_tenant_id,v_user_id,v_owner,p_verification_method,btrim(p_verification_note)
  ) RETURNING id INTO v_request_id;

  INSERT INTO public.platform_audit_logs(
    actor_user_id,actor_aal,action,entity_type,entity_id,tenant_id,after_state
  ) VALUES (
    v_owner,auth.jwt()->>'aal','tenant.manual_admin_password_reset_requested',
    'tenant',v_tenant_id,v_tenant_id,
    jsonb_build_object(
      'application_id',p_application_id,
      'auth_user_id',v_user_id,
      'login_identifier',v_login_identifier,
      'verification_method',p_verification_method,
      'verification_note',btrim(p_verification_note),
      'reset_request_id',v_request_id
    )
  );

  RETURN jsonb_build_object(
    'reset_request_id',v_request_id,
    'auth_user_id',v_user_id,
    'login_identifier',v_login_identifier,
    'tenant_id',v_tenant_id,
    'institution_name',v_institution_name,
    'contact_email',v_contact_email,
    'subdomain',v_subdomain,
    'is_active',v_is_active,
    'contact_email_verified',FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.owner_reserve_manual_admin_password_reset(UUID,TEXT,TEXT)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_reserve_manual_admin_password_reset(UUID,TEXT,TEXT)
  TO authenticated;

COMMENT ON FUNCTION public.owner_reserve_manual_admin_provisioning(UUID,TEXT,BOOLEAN,TEXT,TEXT) IS
  'MFA-protected Owner reservation. Stores contact verification attestation and a 15-minute capability; does not accept or return any password.';
COMMENT ON FUNCTION public.owner_reserve_manual_admin_password_reset(UUID,TEXT,TEXT) IS
  'MFA-protected Owner recovery reservation restricted to the recorded MDI-generated manual administrator identity.';
COMMENT ON COLUMN public.tenants.contact_email_verified IS
  'True only after the institution contact email is independently verified. Manual activation does not set this to true.';
COMMENT ON COLUMN public.tenants.manual_admin_provisioned IS
  'True only for tenants provisioned through the email-independent MDI manual admin account workflow.';
