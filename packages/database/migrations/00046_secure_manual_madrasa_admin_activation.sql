-- MDI 00046: secure, email-independent manual madrasa admin provisioning.
-- Forward-only replacement for the unsafe direct auth.users provisioning in 00045.
-- No credentials are stored in PostgreSQL. Only reservation metadata and audit records are retained.

DROP FUNCTION IF EXISTS public.owner_direct_setup_madrasa_admin(UUID, TEXT, BOOLEAN);

CREATE TABLE IF NOT EXISTS private.manual_admin_provisionings (
  application_id UUID PRIMARY KEY
    REFERENCES public.madrasa_applications(id) ON DELETE RESTRICT,
  reservation_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  login_identifier TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'completed', 'failed')),
  activation_requested BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  attempt_count SMALLINT NOT NULL DEFAULT 1 CHECK (attempt_count BETWEEN 1 AND 3),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT manual_admin_login_identifier_format
    CHECK (login_identifier ~ '^mdi-[0-9a-f]{32}@login[.]sahitech[.]invalid$')
);

ALTER TABLE private.manual_admin_provisionings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.manual_admin_provisionings FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.manual_admin_provisionings TO service_role;

CREATE TABLE IF NOT EXISTS private.manual_admin_password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.madrasa_applications(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  verification_method TEXT NOT NULL
    CHECK (verification_method IN ('phone_call', 'in_person', 'signed_authorization')),
  verification_note TEXT NOT NULL
    CHECK (length(btrim(verification_note)) BETWEEN 20 AND 500),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed')),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS manual_admin_password_reset_rate_idx
  ON private.manual_admin_password_reset_requests(auth_user_id, created_at DESC);

ALTER TABLE private.manual_admin_password_reset_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.manual_admin_password_reset_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.manual_admin_password_reset_requests TO service_role;

CREATE TABLE IF NOT EXISTS private.manual_admin_password_change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  changed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (auth_user_id, changed_at)
);

ALTER TABLE private.manual_admin_password_change_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.manual_admin_password_change_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.manual_admin_password_change_events TO service_role;

CREATE OR REPLACE FUNCTION public.owner_reserve_manual_admin_provisioning(
  p_application_id UUID,
  p_login_identifier TEXT,
  p_activate_immediately BOOLEAN DEFAULT TRUE
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

  SELECT * INTO v_app
  FROM public.madrasa_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND OR v_app.status NOT IN ('pending', 'under_review', 'info_requested', 'approved') THEN
    RAISE EXCEPTION 'application_not_approvable';
  END IF;

  IF v_app.requested_code IS NULL OR v_app.requested_subdomain IS NULL THEN
    RAISE EXCEPTION 'application_missing_tenant_identifiers';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tenants
    WHERE upper(code) = upper(v_app.requested_code)
       OR lower(COALESCE(subdomain, '')) = lower(v_app.requested_subdomain)
  ) THEN
    RAISE EXCEPTION 'tenant_identifier_already_in_use';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants WHERE source_application_id = p_application_id) THEN
    RAISE EXCEPTION 'application_already_provisioned';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id = p_application_id
      AND verification_status = 'verified'
  ) THEN
    RAISE EXCEPTION 'at_least_one_application_document_must_be_verified';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id = p_application_id
      AND verification_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'pending_application_documents_must_be_reviewed';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(p_login_identifier)) THEN
    RAISE EXCEPTION 'manual_login_identifier_already_exists';
  END IF;

  SELECT * INTO v_res
  FROM private.manual_admin_provisionings
  WHERE application_id = p_application_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_res.status = 'completed' THEN
      RAISE EXCEPTION 'application_already_provisioned';
    END IF;
    IF v_res.status = 'reserved' AND v_res.expires_at > now() THEN
      RAISE EXCEPTION 'manual_provisioning_already_in_progress';
    END IF;
    IF v_res.last_attempt_at > now() - interval '24 hours'
       AND v_res.attempt_count >= 3 THEN
      RAISE EXCEPTION 'manual_provisioning_rate_limited';
    END IF;

    v_attempts := CASE
      WHEN v_res.last_attempt_at <= now() - interval '24 hours' THEN 1
      ELSE v_res.attempt_count + 1
    END;

    UPDATE private.manual_admin_provisionings
    SET reservation_id = gen_random_uuid(),
        login_identifier = p_login_identifier,
        status = 'reserved',
        activation_requested = COALESCE(p_activate_immediately, TRUE),
        created_by = v_owner,
        auth_user_id = NULL,
        attempt_count = v_attempts,
        last_attempt_at = now(),
        expires_at = now() + interval '15 minutes',
        completed_at = NULL,
        last_error_code = NULL,
        created_at = now(),
        updated_at = now()
    WHERE application_id = p_application_id
    RETURNING * INTO v_res;
  ELSE
    INSERT INTO private.manual_admin_provisionings(
      application_id, reservation_id, login_identifier, status,
      activation_requested, created_by, attempt_count, last_attempt_at, expires_at
    ) VALUES (
      p_application_id, gen_random_uuid(), p_login_identifier, 'reserved',
      COALESCE(p_activate_immediately, TRUE), v_owner, 1, now(), now() + interval '15 minutes'
    )
    RETURNING * INTO v_res;
  END IF;

  RETURN jsonb_build_object(
    'reservation_id', v_res.reservation_id,
    'login_identifier', v_res.login_identifier,
    'institution_name', v_app.institution_name,
    'contact_person_name', v_app.contact_person_name,
    'contact_phone', v_app.contact_phone,
    'contact_email', v_app.contact_email,
    'activate_immediately', v_res.activation_requested
  );
END;
$$;

REVOKE ALL ON FUNCTION public.owner_reserve_manual_admin_provisioning(UUID, TEXT, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_reserve_manual_admin_provisioning(UUID, TEXT, BOOLEAN)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_complete_manual_admin_provisioning(
  p_reservation_id UUID,
  p_auth_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, extensions, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_res private.manual_admin_provisionings%ROWTYPE;
  v_app public.madrasa_applications%ROWTYPE;
  v_auth_email TEXT;
  v_auth_email_confirmed_at TIMESTAMPTZ;
  v_auth_app_metadata JSONB;
  v_tenant_id UUID;
  v_branch_id UUID;
  v_year_id UUID;
  v_curriculum public.curriculum_type;
  v_immediate BOOLEAN;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_res
  FROM private.manual_admin_provisionings
  WHERE reservation_id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_res.status <> 'reserved'
     OR v_res.created_by <> v_owner
     OR v_res.expires_at <= now() THEN
    RAISE EXCEPTION 'manual_provisioning_reservation_invalid_or_expired';
  END IF;

  SELECT email, email_confirmed_at, raw_app_meta_data
  INTO v_auth_email, v_auth_email_confirmed_at, v_auth_app_metadata
  FROM auth.users
  WHERE id = p_auth_user_id;

  IF NOT FOUND
     OR v_auth_email_confirmed_at IS NULL
     OR lower(v_auth_email) <> lower(v_res.login_identifier)
     OR v_auth_app_metadata->>'mdi_manual_madrasa_admin' <> 'true'
     OR v_auth_app_metadata->>'mdi_force_password_change' <> 'true'
     OR v_auth_app_metadata->>'mdi_provisioning_reservation_id' <> p_reservation_id::TEXT THEN
    RAISE EXCEPTION 'manual_admin_auth_identity_mismatch';
  END IF;

  SELECT * INTO v_app
  FROM public.madrasa_applications
  WHERE id = v_res.application_id
  FOR UPDATE;

  IF NOT FOUND OR v_app.status NOT IN ('pending', 'under_review', 'info_requested', 'approved') THEN
    RAISE EXCEPTION 'application_not_approvable';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants WHERE source_application_id = v_app.id) THEN
    RAISE EXCEPTION 'application_already_provisioned';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id = v_app.id AND verification_status = 'verified'
  ) OR EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id = v_app.id AND verification_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'application_documents_not_fully_reviewed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tenants
    WHERE upper(code) = upper(v_app.requested_code)
       OR lower(COALESCE(subdomain, '')) = lower(v_app.requested_subdomain)
  ) THEN
    RAISE EXCEPTION 'tenant_identifier_already_in_use';
  END IF;

  v_immediate := v_res.activation_requested;
  v_curriculum := CASE v_app.institution_type
    WHEN 'alia' THEN 'alia'::public.curriculum_type
    WHEN 'hybrid' THEN 'hybrid'::public.curriculum_type
    ELSE 'qawmi'::public.curriculum_type
  END;

  INSERT INTO public.profiles(id, full_name_en, full_name_bn, phone)
  VALUES (p_auth_user_id, v_app.contact_person_name, v_app.contact_person_name, v_app.contact_phone)
  ON CONFLICT (id) DO UPDATE SET
    full_name_en = EXCLUDED.full_name_en,
    full_name_bn = COALESCE(public.profiles.full_name_bn, EXCLUDED.full_name_bn),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone);

  INSERT INTO public.tenants(
    name, code, subdomain, curriculum_type, registration_no,
    contact_email, contact_phone, division, district, address,
    is_active, is_verified, onboarding_step, onboarding_completed_at,
    platform_status, source_application_id
  ) VALUES (
    v_app.institution_name, v_app.requested_code, v_app.requested_subdomain,
    v_curriculum, v_app.registration_number,
    v_app.contact_email, v_app.contact_phone, v_app.division, v_app.district, v_app.address,
    v_immediate, v_immediate,
    CASE WHEN v_immediate THEN 6 ELSE 1 END,
    CASE WHEN v_immediate THEN now() ELSE NULL END,
    CASE WHEN v_immediate THEN 'active' ELSE 'pending_activation' END,
    v_app.id
  )
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.branches(tenant_id, name, code, is_main_branch, address, phone)
  VALUES (v_tenant_id, 'প্রধান ক্যাম্পাস (Main Campus)', 'MAIN', TRUE, v_app.address, v_app.contact_phone)
  RETURNING id INTO v_branch_id;

  INSERT INTO public.tenant_users(tenant_id, user_id, branch_id, role, is_active)
  VALUES (v_tenant_id, p_auth_user_id, v_branch_id, 'madrasa_admin', TRUE);

  INSERT INTO public.academic_years(
    tenant_id, name_bn, name_en, hijri_year, start_date, end_date, is_current
  ) VALUES (
    v_tenant_id, 'চলতি শিক্ষাবর্ষ', 'Current Academic Year', NULL,
    date_trunc('year', current_date)::date,
    (date_trunc('year', current_date) + interval '1 year - 1 day')::date,
    TRUE
  ) RETURNING id INTO v_year_id;

  IF v_curriculum IN ('qawmi', 'hybrid') THEN
    INSERT INTO public.departments(tenant_id, name_bn, name_en, name_ar, code, curriculum_type)
    VALUES
      (v_tenant_id, 'কিতাব বিভাগ', 'Kitab Department', 'قسم الكتب الشرعية', 'KTB', 'qawmi'),
      (v_tenant_id, 'হিফজুল কুরআন বিভাগ', 'Hifzul Quran', 'قسم تحفيظ القرآن', 'HFZ', 'qawmi'),
      (v_tenant_id, 'নূরানী ও মক্তব বিভাগ', 'Nurani & Maktab', 'المكتب النوراني', 'NUR', 'qawmi');
  END IF;

  IF v_curriculum IN ('alia', 'hybrid') THEN
    INSERT INTO public.departments(tenant_id, name_bn, name_en, name_ar, code, curriculum_type)
    VALUES
      (v_tenant_id, 'ইবতেদায়ি বিভাগ', 'Ebtedayee Primary Wing', 'المرحلة الابتدائية', 'EBT', 'alia'),
      (v_tenant_id, 'দাখিল বিভাগ', 'Dakhil Secondary Wing', 'المرحلة الثانوية', 'DAK', 'alia'),
      (v_tenant_id, 'আলিম বিভাগ', 'Alim Higher Secondary Wing', 'المرحلة العالية', 'ALM', 'alia');
  END IF;

  UPDATE public.madrasa_applications
  SET status = 'approved', reviewed_by = v_owner, reviewed_at = now(), updated_at = now()
  WHERE id = v_app.id;

  UPDATE public.platform_invitations
  SET status = 'revoked', revoked_at = now()
  WHERE application_id = v_app.id AND status IN ('pending', 'sent');

  UPDATE public.email_outbox
  SET status = 'cancelled',
      last_error = 'Superseded by owner-approved manual admin activation'
  WHERE event_type = 'madrasa_invitation'
    AND payload->>'application_id' = v_app.id::TEXT
    AND status IN ('queued', 'failed');

  UPDATE private.manual_admin_provisionings
  SET status = 'completed',
      auth_user_id = p_auth_user_id,
      completed_at = now(),
      updated_at = now(),
      last_error_code = NULL
  WHERE application_id = v_app.id;

  INSERT INTO public.platform_audit_logs(
    actor_user_id, actor_aal, action, entity_type, entity_id, tenant_id, after_state
  ) VALUES (
    v_owner, auth.jwt()->>'aal', 'tenant.manual_admin_provisioned',
    'tenant', v_tenant_id, v_tenant_id,
    jsonb_build_object(
      'application_id', v_app.id,
      'auth_user_id', p_auth_user_id,
      'login_identifier', v_res.login_identifier,
      'contact_email_verified', FALSE,
      'activation_status', CASE WHEN v_immediate THEN 'active' ELSE 'pending_activation' END
    )
  );

  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'branch_id', v_branch_id,
    'academic_year_id', v_year_id,
    'login_identifier', v_res.login_identifier,
    'institution_name', v_app.institution_name,
    'subdomain', v_app.requested_subdomain,
    'activated', v_immediate,
    'contact_email_verified', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.owner_complete_manual_admin_provisioning(UUID, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_complete_manual_admin_provisioning(UUID, UUID)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_fail_manual_admin_provisioning(
  p_reservation_id UUID,
  p_error_code TEXT DEFAULT 'provisioning_failed'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_res private.manual_admin_provisionings%ROWTYPE;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;

  UPDATE private.manual_admin_provisionings
  SET status = 'failed',
      last_error_code = CASE
        WHEN p_error_code IN ('auth_user_creation_failed', 'tenant_finalization_failed', 'auth_user_cleanup_failed')
          THEN p_error_code
        ELSE 'provisioning_failed'
      END,
      updated_at = now()
  WHERE reservation_id = p_reservation_id
    AND created_by = v_owner
    AND status = 'reserved'
  RETURNING * INTO v_res;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.platform_audit_logs(
    actor_user_id, actor_aal, action, entity_type, entity_id, after_state
  ) VALUES (
    v_owner, auth.jwt()->>'aal', 'tenant.manual_admin_provisioning_failed',
    'madrasa_application', v_res.application_id,
    jsonb_build_object('error_code', v_res.last_error_code, 'attempt_count', v_res.attempt_count)
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_fail_manual_admin_provisioning(UUID, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_fail_manual_admin_provisioning(UUID, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_reserve_manual_admin_password_reset(
  p_application_id UUID,
  p_verification_method TEXT,
  p_verification_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_tenant_id UUID;
  v_institution_name TEXT;
  v_contact_email TEXT;
  v_subdomain TEXT;
  v_user_id UUID;
  v_admin_count INTEGER;
  v_request_id UUID;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;

  IF p_verification_method IS NULL
     OR p_verification_method NOT IN ('phone_call', 'in_person', 'signed_authorization')
     OR p_verification_note IS NULL
     OR length(btrim(p_verification_note)) NOT BETWEEN 20 AND 500 THEN
    RAISE EXCEPTION 'manual_recovery_verification_required';
  END IF;

  SELECT id, name, contact_email, subdomain INTO v_tenant_id, v_institution_name, v_contact_email, v_subdomain
  FROM public.tenants
  WHERE source_application_id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'provisioned_tenant_not_found';
  END IF;

  SELECT count(*) INTO v_admin_count
  FROM public.tenant_users
  WHERE tenant_id = v_tenant_id
    AND role = 'madrasa_admin'::public.user_role
    AND is_active = TRUE;

  IF v_admin_count <> 1 THEN
    RAISE EXCEPTION 'manual_recovery_requires_exactly_one_active_madrasa_admin';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.tenant_users
  WHERE tenant_id = v_tenant_id
    AND role = 'madrasa_admin'::public.user_role
    AND is_active = TRUE
  LIMIT 1;

  IF (
    SELECT count(*)
    FROM private.manual_admin_password_reset_requests
    WHERE auth_user_id = v_user_id
      AND created_at > now() - interval '24 hours'
  ) >= 3 THEN
    RAISE EXCEPTION 'manual_password_reset_rate_limited';
  END IF;

  INSERT INTO private.manual_admin_password_reset_requests(
    application_id, tenant_id, auth_user_id, initiated_by,
    verification_method, verification_note
  ) VALUES (
    p_application_id, v_tenant_id, v_user_id, v_owner,
    p_verification_method, btrim(p_verification_note)
  ) RETURNING id INTO v_request_id;

  INSERT INTO public.platform_audit_logs(
    actor_user_id, actor_aal, action, entity_type, entity_id, tenant_id, after_state
  ) VALUES (
    v_owner, auth.jwt()->>'aal', 'tenant.manual_admin_password_reset_requested',
    'tenant', v_tenant_id, v_tenant_id,
    jsonb_build_object(
      'application_id', p_application_id,
      'auth_user_id', v_user_id,
      'verification_method', p_verification_method,
      'verification_note', btrim(p_verification_note),
      'reset_request_id', v_request_id
    )
  );

  RETURN jsonb_build_object(
    'reset_request_id', v_request_id,
    'auth_user_id', v_user_id,
    'tenant_id', v_tenant_id,
    'institution_name', v_institution_name,
    'contact_email', v_contact_email,
    'subdomain', v_subdomain
  );
END;
$$;

REVOKE ALL ON FUNCTION public.owner_reserve_manual_admin_password_reset(UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_reserve_manual_admin_password_reset(UUID, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_complete_manual_admin_password_reset(
  p_reset_request_id UUID,
  p_succeeded BOOLEAN,
  p_error_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_request private.manual_admin_password_reset_requests%ROWTYPE;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_request
  FROM private.manual_admin_password_reset_requests
  WHERE id = p_reset_request_id
    AND initiated_by = v_owner
  FOR UPDATE;

  IF NOT FOUND OR v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'manual_password_reset_request_invalid';
  END IF;

  UPDATE private.manual_admin_password_reset_requests
  SET status = CASE WHEN p_succeeded THEN 'completed' ELSE 'failed' END,
      error_code = CASE
        WHEN p_succeeded THEN NULL
        WHEN p_error_code IN ('auth_update_failed', 'audit_finalize_failed') THEN p_error_code
        ELSE 'password_reset_failed'
      END,
      completed_at = now()
  WHERE id = p_reset_request_id;

  INSERT INTO public.platform_audit_logs(
    actor_user_id, actor_aal, action, entity_type, entity_id, tenant_id, after_state
  ) VALUES (
    v_owner, auth.jwt()->>'aal',
    CASE WHEN p_succeeded
      THEN 'tenant.manual_admin_password_reset_completed'
      ELSE 'tenant.manual_admin_password_reset_failed'
    END,
    'tenant', v_request.tenant_id, v_request.tenant_id,
    jsonb_build_object(
      'application_id', v_request.application_id,
      'auth_user_id', v_request.auth_user_id,
      'reset_request_id', p_reset_request_id,
      'error_code', CASE
        WHEN p_succeeded THEN NULL
        WHEN p_error_code IN ('auth_update_failed', 'audit_finalize_failed') THEN p_error_code
        ELSE 'password_reset_failed'
      END
    )
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_complete_manual_admin_password_reset(UUID, BOOLEAN, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_complete_manual_admin_password_reset(UUID, BOOLEAN, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.record_manual_admin_password_change()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_app_metadata JSONB;
  v_tenant_id UUID;
  v_changed_at TIMESTAMPTZ;
  v_inserted UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT raw_app_meta_data INTO v_app_metadata
  FROM auth.users
  WHERE id = v_user_id;

  IF NOT FOUND
     OR v_app_metadata->>'mdi_manual_madrasa_admin' <> 'true'
     OR v_app_metadata->>'mdi_force_password_change' <> 'false' THEN
    RAISE EXCEPTION 'manual_admin_password_change_not_eligible' USING ERRCODE = '42501';
  END IF;

  v_changed_at := NULLIF(v_app_metadata->>'mdi_password_changed_at', '')::TIMESTAMPTZ;
  IF v_changed_at IS NULL THEN
    RAISE EXCEPTION 'password_change_timestamp_missing';
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_users
  WHERE user_id = v_user_id
    AND role = 'madrasa_admin'::public.user_role
    AND is_active = TRUE
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'active_madrasa_admin_membership_required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO private.manual_admin_password_change_events(auth_user_id, tenant_id, changed_at)
  VALUES (v_user_id, v_tenant_id, v_changed_at)
  ON CONFLICT (auth_user_id, changed_at) DO NOTHING
  RETURNING id INTO v_inserted;

  IF v_inserted IS NOT NULL THEN
    INSERT INTO public.platform_audit_logs(
      actor_user_id, actor_aal, action, entity_type, entity_id, tenant_id, after_state
    ) VALUES (
      v_user_id, auth.jwt()->>'aal', 'tenant.manual_admin_password_changed',
      'tenant', v_tenant_id, v_tenant_id,
      jsonb_build_object('password_change_required', FALSE, 'changed_at', v_changed_at)
    );
  END IF;

  RETURN v_inserted IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.record_manual_admin_password_change() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_manual_admin_password_change() TO authenticated;

COMMENT ON TABLE private.manual_admin_provisionings IS
  'Owner-only workflow state for email-independent madrasa admin provisioning. Stores no passwords; the .invalid address is a non-routable login identifier, not a contact email.';
COMMENT ON TABLE private.manual_admin_password_reset_requests IS
  'Owner-attested, rate-limited manual password recovery requests. Verification method and reason are audited; passwords are never stored.';
COMMENT ON FUNCTION public.record_manual_admin_password_change() IS
  'One-time/idempotent audit recorder for a manual Madrasa Admin completing a forced password change.';



-- Database-level fail-closed gate: middleware alone is not sufficient because
-- authenticated users can call the Supabase Data API directly.
CREATE OR REPLACE FUNCTION private.can_use_mdi_tenant_features()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users AS u
    WHERE u.id = (SELECT auth.uid())
      AND NOT (
        u.raw_app_meta_data->>'mdi_manual_madrasa_admin' = 'true'
        AND u.raw_app_meta_data->>'mdi_force_password_change' = 'true'
      )
  );
$$;
REVOKE ALL ON FUNCTION private.can_use_mdi_tenant_features() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.get_auth_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
  SELECT tu.tenant_id
  FROM public.tenant_users AS tu
  JOIN public.tenants AS t ON t.id = tu.tenant_id
  WHERE tu.user_id = (SELECT auth.uid())
    AND tu.is_active = TRUE
    AND tu.role <> 'super_admin'::public.user_role
    AND t.is_active = TRUE
    AND t.platform_status = 'active'
    AND private.can_use_mdi_tenant_features();
$$;

CREATE OR REPLACE FUNCTION private.has_tenant_onboarding_access(target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
  SELECT private.can_use_mdi_tenant_features() AND EXISTS (
    SELECT 1
    FROM public.tenant_users AS tu
    JOIN public.tenants AS t ON t.id = tu.tenant_id
    WHERE tu.tenant_id = target_tenant_id
      AND tu.user_id = (SELECT auth.uid())
      AND tu.role = 'madrasa_admin'::public.user_role
      AND tu.is_active = TRUE
      AND t.platform_status = 'pending_activation'
      AND t.is_active = FALSE
  );
$$;

CREATE OR REPLACE FUNCTION private.has_tenant_onboarding_write(target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
  SELECT private.can_use_mdi_tenant_features() AND EXISTS (
    SELECT 1
    FROM public.tenant_users AS tu
    JOIN public.tenants AS t ON t.id = tu.tenant_id
    WHERE tu.tenant_id = target_tenant_id
      AND tu.user_id = (SELECT auth.uid())
      AND tu.role = 'madrasa_admin'::public.user_role
      AND tu.is_active = TRUE
      AND t.platform_status = 'pending_activation'
      AND t.is_active = FALSE
      AND t.onboarding_completed_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION private.has_tenant_role(target_tenant_id uuid, required_roles public.user_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
  SELECT private.can_use_mdi_tenant_features() AND EXISTS (
    SELECT 1
    FROM public.tenant_users AS tu
    JOIN public.tenants AS t ON t.id = tu.tenant_id
    WHERE tu.tenant_id = target_tenant_id
      AND tu.user_id = (SELECT auth.uid())
      AND tu.role <> 'super_admin'::public.user_role
      AND tu.role = ANY(array_remove(required_roles, 'super_admin'::public.user_role))
      AND tu.is_active = TRUE
      AND t.is_active = TRUE
      AND t.platform_status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION private.get_auth_tenant_ids() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_tenant_onboarding_access(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_tenant_onboarding_write(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_tenant_role(uuid, public.user_role[]) FROM PUBLIC, anon, authenticated;

-- These four private helpers are intentionally callable by application roles through
-- the existing SECURITY INVOKER public wrappers created in migration 00044.
GRANT EXECUTE ON FUNCTION private.get_auth_tenant_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_tenant_onboarding_access(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_tenant_onboarding_write(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_tenant_role(uuid, public.user_role[]) TO anon, authenticated;

COMMENT ON FUNCTION private.can_use_mdi_tenant_features() IS
  'Database-level access gate for the mandatory first password change on manually provisioned madrasa admin accounts.';


-- Safe current-session query for Middleware/Server Components. It exposes only the
-- authenticated caller's own mandatory-password-change state and uses DB metadata
-- so password resets take effect even when an access token still contains old claims.
CREATE OR REPLACE FUNCTION public.mdi_manual_password_change_required()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
     AND NOT private.can_use_mdi_tenant_features();
$$;
REVOKE ALL ON FUNCTION public.mdi_manual_password_change_required() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mdi_manual_password_change_required() TO authenticated;

COMMENT ON FUNCTION public.mdi_manual_password_change_required() IS
  'Returns only the caller own authoritative manual-admin password-change gate, using Auth app metadata stored in auth.users rather than possibly stale JWT claims.';
