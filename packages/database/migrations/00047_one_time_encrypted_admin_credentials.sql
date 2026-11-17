-- MDI 00047: move one-time temporary credentials out of Server Action results.
-- Credentials are AES-256-GCM encrypted in a private table for at most five minutes.
-- Only the authenticated AAL2 Global Owner can atomically consume the envelope once.

CREATE TABLE IF NOT EXISTS private.manual_admin_credential_envelopes (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  application_id UUID NOT NULL REFERENCES public.madrasa_applications(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  reservation_id UUID UNIQUE REFERENCES private.manual_admin_provisionings(reservation_id) ON DELETE RESTRICT,
  reset_request_id UUID UNIQUE REFERENCES private.manual_admin_password_reset_requests(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL CHECK (purpose IN ('provisioning', 'password_reset')),
  ciphertext TEXT NOT NULL CHECK (length(ciphertext) BETWEEN 32 AND 12000),
  iv TEXT NOT NULL CHECK (iv ~ '^[A-Za-z0-9+/]{16}$'),
  auth_tag TEXT NOT NULL CHECK (auth_tag ~ '^[A-Za-z0-9+/]{22}==$'),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((purpose = 'provisioning' AND reservation_id IS NOT NULL AND reset_request_id IS NULL)
      OR (purpose = 'password_reset' AND reset_request_id IS NOT NULL AND reservation_id IS NULL))
);

ALTER TABLE private.manual_admin_credential_envelopes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.manual_admin_credential_envelopes FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.manual_admin_credential_envelopes TO service_role;

CREATE OR REPLACE FUNCTION public.owner_complete_manual_admin_provisioning_with_envelope(
  p_reservation_id UUID,
  p_auth_user_id UUID,
  p_credential_envelope_id UUID,
  p_credential_ciphertext TEXT,
  p_credential_iv TEXT,
  p_credential_auth_tag TEXT
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
  IF v_owner IS NULL OR auth.jwt()->>'aal' IS DISTINCT FROM 'aal2' OR NOT private.is_platform_owner() THEN
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
     OR v_auth_email IS NULL
     OR v_auth_email_confirmed_at IS NULL
     OR lower(v_auth_email) IS DISTINCT FROM lower(v_res.login_identifier)
     OR COALESCE(v_auth_app_metadata->>'mdi_manual_madrasa_admin', 'false') IS DISTINCT FROM 'true'
     OR COALESCE(v_auth_app_metadata->>'mdi_force_password_change', 'false') IS DISTINCT FROM 'true'
     OR COALESCE(v_auth_app_metadata->>'mdi_provisioning_reservation_id', '') IS DISTINCT FROM p_reservation_id::TEXT THEN
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

  IF p_credential_envelope_id IS NULL
     OR p_credential_ciphertext IS NULL
     OR length(p_credential_ciphertext) NOT BETWEEN 32 AND 12000
     OR p_credential_ciphertext !~ '^[A-Za-z0-9+/]+={0,2}
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
     OR p_credential_iv !~ '^[A-Za-z0-9+/]{16}
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
     OR p_credential_auth_tag !~ '^[A-Za-z0-9+/]{22}==
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
$$; THEN
    RAISE EXCEPTION 'invalid_manual_credential_envelope';
  END IF;

  INSERT INTO private.manual_admin_credential_envelopes(
    id, owner_user_id, application_id, tenant_id, reservation_id,
    purpose, ciphertext, iv, auth_tag, expires_at
  ) VALUES (
    p_credential_envelope_id, v_owner, v_app.id, v_tenant_id, p_reservation_id,
    'provisioning', p_credential_ciphertext, p_credential_iv, p_credential_auth_tag,
    now() + interval '5 minutes'
  );

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

REVOKE ALL ON FUNCTION public.owner_complete_manual_admin_provisioning_with_envelope(UUID, UUID, UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_complete_manual_admin_provisioning_with_envelope(UUID, UUID, UUID, TEXT, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_complete_manual_admin_password_reset_with_envelope(
  p_reset_request_id UUID,
  p_succeeded BOOLEAN,
  p_error_code TEXT DEFAULT NULL,
  p_credential_envelope_id UUID DEFAULT NULL,
  p_credential_ciphertext TEXT DEFAULT NULL,
  p_credential_iv TEXT DEFAULT NULL,
  p_credential_auth_tag TEXT DEFAULT NULL
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
  IF v_owner IS NULL OR auth.jwt()->>'aal' IS DISTINCT FROM 'aal2' OR NOT private.is_platform_owner() THEN
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

  IF p_succeeded THEN
    IF p_credential_envelope_id IS NULL
       OR p_credential_ciphertext IS NULL
       OR length(p_credential_ciphertext) NOT BETWEEN 32 AND 12000
       OR p_credential_ciphertext !~ '^[A-Za-z0-9+/]+={0,2}
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
       OR p_credential_iv !~ '^[A-Za-z0-9+/]{16}
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
       OR p_credential_auth_tag !~ '^[A-Za-z0-9+/]{22}==
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
$$; THEN
      RAISE EXCEPTION 'invalid_manual_credential_envelope';
    END IF;

    INSERT INTO private.manual_admin_credential_envelopes(
      id, owner_user_id, application_id, tenant_id, reset_request_id,
      purpose, ciphertext, iv, auth_tag, expires_at
    ) VALUES (
      p_credential_envelope_id, v_owner, v_request.application_id, v_request.tenant_id,
      p_reset_request_id, 'password_reset', p_credential_ciphertext,
      p_credential_iv, p_credential_auth_tag, now() + interval '5 minutes'
    );
  END IF;

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

REVOKE ALL ON FUNCTION public.owner_complete_manual_admin_password_reset_with_envelope(UUID, BOOLEAN, TEXT, UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_complete_manual_admin_password_reset_with_envelope(UUID, BOOLEAN, TEXT, UUID, TEXT, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_consume_manual_admin_credential_envelope(p_envelope_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_envelope private.manual_admin_credential_envelopes%ROWTYPE;
BEGIN
  IF v_owner IS NULL OR auth.jwt()->>'aal' IS DISTINCT FROM 'aal2'
     OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;

  UPDATE private.manual_admin_credential_envelopes
  SET consumed_at = now()
  WHERE id = p_envelope_id
    AND owner_user_id = v_owner
    AND consumed_at IS NULL
    AND expires_at > now()
  RETURNING * INTO v_envelope;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'credential_envelope_missing_expired_or_already_consumed';
  END IF;

  INSERT INTO public.platform_audit_logs(
    actor_user_id, actor_aal, action, entity_type, entity_id, tenant_id, after_state
  ) VALUES (
    v_owner, auth.jwt()->>'aal', 'tenant.manual_admin_credentials_revealed',
    'tenant', v_envelope.tenant_id, v_envelope.tenant_id,
    jsonb_build_object(
      'application_id', v_envelope.application_id,
      'credential_envelope_id', v_envelope.id,
      'purpose', v_envelope.purpose
    )
  );

  RETURN jsonb_build_object(
    'envelope_id', v_envelope.id,
    'owner_user_id', v_envelope.owner_user_id,
    'purpose', v_envelope.purpose,
    'ciphertext', v_envelope.ciphertext,
    'iv', v_envelope.iv,
    'auth_tag', v_envelope.auth_tag,
    'expires_at', v_envelope.expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.owner_consume_manual_admin_credential_envelope(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_consume_manual_admin_credential_envelope(UUID)
  TO authenticated;

COMMENT ON TABLE private.manual_admin_credential_envelopes IS
  'Short-lived encrypted credential envelopes. Plaintext passwords are never persisted. AAL2 Global Owner can consume each envelope exactly once within five minutes.';
