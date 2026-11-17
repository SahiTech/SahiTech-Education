-- MDI 00045: secure, email-independent manual madrasa administrator provisioning.
-- This migration was not present in either connected database ledger during the
-- 2026-11-17 audit. It replaces the pending, unsafe direct-password migration
-- before that migration is applied anywhere. Never store or return a password here.

ALTER TABLE public.madrasa_applications
  ADD COLUMN IF NOT EXISTS contact_person_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_person_verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_person_verification_method TEXT;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS contact_email_verified BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.madrasa_applications'::regclass
      AND conname='madrasa_applications_contact_verification_method_check'
  ) THEN
    ALTER TABLE public.madrasa_applications
      ADD CONSTRAINT madrasa_applications_contact_verification_method_check
      CHECK (
        contact_person_verification_method IS NULL
        OR contact_person_verification_method IN ('phone_call','whatsapp','in_person')
      );
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.owner_direct_setup_madrasa_admin(UUID, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.owner_provision_manual_madrasa_admin(
  p_application_id UUID,
  p_admin_user_id UUID,
  p_activate_immediately BOOLEAN DEFAULT TRUE,
  p_contact_verification_method TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, extensions, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_app public.madrasa_applications%ROWTYPE;
  v_auth_email TEXT;
  v_auth_app_metadata JSONB;
  v_tenant_id UUID;
  v_branch_id UUID;
  v_year_id UUID;
  v_curriculum public.curriculum_type;
  v_activation_status TEXT;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE='42501';
  END IF;

  IF p_application_id IS NULL OR p_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_provisioning_request';
  END IF;

  IF p_contact_verification_method NOT IN ('phone_call','whatsapp','in_person') THEN
    RAISE EXCEPTION 'owner_contact_verification_required';
  END IF;

  IF (
    SELECT count(*) FROM public.platform_audit_logs
    WHERE actor_user_id=v_owner
      AND action='tenant.manual_admin_credentials_issued'
      AND created_at>now()-interval '1 hour'
  ) >= 10 THEN
    RAISE EXCEPTION 'manual_provisioning_rate_limit' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_app
  FROM public.madrasa_applications
  WHERE id=p_application_id
  FOR UPDATE;

  IF NOT FOUND OR v_app.status NOT IN ('pending','under_review','info_requested','approved') THEN
    RAISE EXCEPTION 'application_not_eligible_for_manual_provisioning';
  END IF;

  IF v_app.requested_code IS NULL OR v_app.requested_subdomain IS NULL THEN
    RAISE EXCEPTION 'application_missing_tenant_identifiers';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants WHERE source_application_id=v_app.id) THEN
    RAISE EXCEPTION 'application_already_provisioned';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tenants
    WHERE upper(code)=upper(v_app.requested_code)
       OR lower(COALESCE(subdomain,''))=lower(v_app.requested_subdomain)
  ) THEN
    RAISE EXCEPTION 'tenant_identifier_already_in_use';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id=v_app.id AND verification_status='verified'
  ) THEN
    RAISE EXCEPTION 'at_least_one_application_document_must_be_verified';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.madrasa_application_documents
    WHERE application_id=v_app.id AND verification_status='pending'
  ) THEN
    RAISE EXCEPTION 'pending_application_documents_must_be_reviewed';
  END IF;

  -- Do not take over an existing account registered to the applicant's real email.
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email)=lower(v_app.contact_email)
  ) THEN
    RAISE EXCEPTION 'existing_contact_email_account_requires_separate_recovery';
  END IF;

  -- Manual accounts use an internal, non-deliverable login alias. The submitted
  -- contact email is NOT confirmed by this workflow and stays false on tenants.
  SELECT email, raw_app_meta_data
  INTO v_auth_email, v_auth_app_metadata
  FROM auth.users
  WHERE id=p_admin_user_id;

  IF NOT FOUND
     OR v_auth_email !~ '^mdi-[a-f0-9]{24}@accounts[.]sahitech[.]invalid$'
     OR COALESCE(v_auth_app_metadata->>'mdi_manual_provisioning','false') <> 'true'
     OR COALESCE(v_auth_app_metadata->>'mdi_force_password_change','false') <> 'true' THEN
    RAISE EXCEPTION 'invalid_manual_auth_identity';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenant_users WHERE user_id=p_admin_user_id) THEN
    RAISE EXCEPTION 'manual_auth_identity_already_assigned';
  END IF;

  v_curriculum := CASE v_app.institution_type
    WHEN 'alia' THEN 'alia'::public.curriculum_type
    WHEN 'hybrid' THEN 'hybrid'::public.curriculum_type
    ELSE 'qawmi'::public.curriculum_type
  END;

  v_activation_status := CASE WHEN p_activate_immediately THEN 'active' ELSE 'pending_activation' END;

  INSERT INTO public.profiles(id,full_name_en,full_name_bn,phone)
  VALUES(p_admin_user_id,v_app.contact_person_name,v_app.contact_person_name,v_app.contact_phone)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.tenants(
    name,code,subdomain,curriculum_type,registration_no,
    contact_email,contact_email_verified,contact_phone,division,district,address,
    is_active,is_verified,onboarding_step,onboarding_completed_at,
    platform_status,source_application_id
  ) VALUES (
    v_app.institution_name,v_app.requested_code,v_app.requested_subdomain,v_curriculum,v_app.registration_number,
    v_app.contact_email,FALSE,v_app.contact_phone,v_app.division,v_app.district,v_app.address,
    p_activate_immediately,p_activate_immediately,
    CASE WHEN p_activate_immediately THEN 6 ELSE 1 END,
    CASE WHEN p_activate_immediately THEN now() ELSE NULL END,
    v_activation_status,v_app.id
  ) RETURNING id INTO v_tenant_id;

  INSERT INTO public.branches(tenant_id,name,code,is_main_branch,address,phone)
  VALUES(v_tenant_id,'প্রধান ক্যাম্পাস (Main Campus)','MAIN',TRUE,v_app.address,v_app.contact_phone)
  RETURNING id INTO v_branch_id;

  INSERT INTO public.tenant_users(tenant_id,user_id,branch_id,role,is_active)
  VALUES(v_tenant_id,p_admin_user_id,v_branch_id,'madrasa_admin',TRUE);

  INSERT INTO public.academic_years(
    tenant_id,name_bn,name_en,hijri_year,start_date,end_date,is_current
  ) VALUES (
    v_tenant_id,'চলতি শিক্ষাবর্ষ','Current Academic Year',NULL,
    date_trunc('year',current_date)::date,
    (date_trunc('year',current_date)+interval '1 year - 1 day')::date,
    TRUE
  ) RETURNING id INTO v_year_id;

  IF v_curriculum IN ('qawmi','hybrid') THEN
    INSERT INTO public.departments(tenant_id,name_bn,name_en,name_ar,code,curriculum_type)
    VALUES
      (v_tenant_id,'কিতাব বিভাগ','Kitab Department','قسم الكتب الشرعية','KTB','qawmi'),
      (v_tenant_id,'হিফজুল কুরআন বিভাগ','Hifzul Quran','قسم تحفيظ القرآن','HFZ','qawmi'),
      (v_tenant_id,'নূরানী ও মক্তব বিভাগ','Nurani & Maktab','المكتب النوراني','NUR','qawmi');
  END IF;

  IF v_curriculum IN ('alia','hybrid') THEN
    INSERT INTO public.departments(tenant_id,name_bn,name_en,name_ar,code,curriculum_type)
    VALUES
      (v_tenant_id,'ইবতেদায়ি বিভাগ','Ebtedayee Primary Wing','المرحلة الابتدائية','EBT','alia'),
      (v_tenant_id,'দাখিল বিভাগ','Dakhil Secondary Wing','المرحلة الثانوية','DAK','alia'),
      (v_tenant_id,'আলিম বিভাগ','Alim Higher Secondary Wing','المرحلة العالية','ALM','alia');
  END IF;

  UPDATE public.madrasa_applications
  SET status='approved',
      reviewed_by=v_owner,
      reviewed_at=now(),
      contact_person_verified_at=now(),
      contact_person_verified_by=v_owner,
      contact_person_verification_method=p_contact_verification_method,
      updated_at=now()
  WHERE id=v_app.id;

  UPDATE public.platform_invitations
  SET status='revoked',revoked_at=now()
  WHERE application_id=v_app.id AND status IN ('pending','sent');

  UPDATE public.email_outbox
  SET status='cancelled',
      last_error='Superseded by Owner-approved manual activation'
  WHERE status IN ('queued','failed')
    AND payload->>'application_id'=v_app.id::TEXT
    AND event_type='madrasa_invitation';

  INSERT INTO public.platform_audit_logs(
    actor_user_id,actor_aal,action,entity_type,entity_id,tenant_id,after_state
  ) VALUES (
    v_owner,auth.jwt()->>'aal','tenant.manual_admin_credentials_issued',
    'tenant',v_tenant_id,v_tenant_id,
    jsonb_build_object(
      'application_id',v_app.id,
      'admin_user_id',p_admin_user_id,
      'login_identifier',v_auth_email,
      'contact_person_verification_method',p_contact_verification_method,
      'contact_email_verified',FALSE,
      'activated',p_activate_immediately
    )
  );

  RETURN jsonb_build_object(
    'tenant_id',v_tenant_id,
    'admin_user_id',p_admin_user_id,
    'login_identifier',v_auth_email,
    'institution_name',v_app.institution_name,
    'subdomain',v_app.requested_subdomain,
    'activation_status',v_activation_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.owner_provision_manual_madrasa_admin(UUID,UUID,BOOLEAN,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_provision_manual_madrasa_admin(UUID,UUID,BOOLEAN,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_prepare_manual_admin_recovery(
  p_application_id UUID,
  p_reason TEXT,
  p_contact_verification_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_tenant_id UUID;
  v_admin_id UUID;
  v_login_identifier TEXT;
  v_contact_email TEXT;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE='42501';
  END IF;
  IF length(btrim(COALESCE(p_reason,''))) NOT BETWEEN 20 AND 500 THEN
    RAISE EXCEPTION 'manual_recovery_reason_required';
  END IF;
  IF p_contact_verification_method NOT IN ('phone_call','whatsapp','in_person') THEN
    RAISE EXCEPTION 'owner_contact_verification_required';
  END IF;

  IF (
    SELECT count(*) FROM public.platform_audit_logs
    WHERE actor_user_id=v_owner
      AND action IN ('tenant.manual_admin_recovery_requested','tenant.manual_admin_recovery_succeeded')
      AND created_at>now()-interval '24 hours'
  ) >= 5 THEN
    RAISE EXCEPTION 'manual_recovery_rate_limit' USING ERRCODE='42501';
  END IF;

  SELECT t.id,t.contact_email,tu.user_id,u.email
  INTO v_tenant_id,v_contact_email,v_admin_id,v_login_identifier
  FROM public.tenants t
  JOIN public.tenant_users tu ON tu.tenant_id=t.id AND tu.role='madrasa_admin'::public.user_role AND tu.is_active=TRUE
  JOIN auth.users u ON u.id=tu.user_id
  WHERE t.source_application_id=p_application_id
    AND u.email ~ '^mdi-[a-f0-9]{24}@accounts[.]sahitech[.]invalid$'
    AND COALESCE(u.raw_app_meta_data->>'mdi_manual_provisioning','false')='true'
  ORDER BY tu.created_at ASC
  LIMIT 1
  FOR UPDATE OF t;

  IF v_tenant_id IS NULL OR v_admin_id IS NULL THEN
    RAISE EXCEPTION 'manual_admin_account_not_found';
  END IF;

  INSERT INTO public.platform_audit_logs(
    actor_user_id,actor_aal,action,entity_type,entity_id,tenant_id,after_state
  ) VALUES (
    v_owner,auth.jwt()->>'aal','tenant.manual_admin_recovery_requested',
    'tenant',v_tenant_id,v_tenant_id,
    jsonb_build_object(
      'application_id',p_application_id,
      'admin_user_id',v_admin_id,
      'reason',btrim(p_reason),
      'contact_verification_method',p_contact_verification_method
    )
  );

  RETURN jsonb_build_object(
    'tenant_id',v_tenant_id,
    'admin_user_id',v_admin_id,
    'login_identifier',v_login_identifier,
    'contact_email',v_contact_email
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_finalize_manual_admin_recovery(
  p_application_id UUID,
  p_admin_user_id UUID,
  p_outcome TEXT,
  p_error_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_tenant_id UUID;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE='42501';
  END IF;
  IF p_outcome NOT IN ('succeeded','failed') THEN
    RAISE EXCEPTION 'invalid_recovery_outcome';
  END IF;

  SELECT id INTO v_tenant_id
  FROM public.tenants
  WHERE source_application_id=p_application_id;

  IF v_tenant_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    JOIN auth.users u ON u.id=tu.user_id
    WHERE tu.tenant_id=v_tenant_id
      AND tu.user_id=p_admin_user_id
      AND tu.role='madrasa_admin'::public.user_role
      AND u.email ~ '^mdi-[a-f0-9]{24}@accounts[.]sahitech[.]invalid$'
      AND COALESCE(u.raw_app_meta_data->>'mdi_manual_provisioning','false')='true'
  ) THEN
    RAISE EXCEPTION 'manual_admin_account_not_found';
  END IF;

  INSERT INTO public.platform_audit_logs(
    actor_user_id,actor_aal,action,entity_type,entity_id,tenant_id,after_state
  ) VALUES (
    v_owner,auth.jwt()->>'aal',
    CASE WHEN p_outcome='succeeded' THEN 'tenant.manual_admin_recovery_succeeded' ELSE 'tenant.manual_admin_recovery_failed' END,
    'tenant',v_tenant_id,v_tenant_id,
    jsonb_build_object(
      'application_id',p_application_id,
      'admin_user_id',p_admin_user_id,
      'error_code',left(COALESCE(p_error_code,''),80)
    )
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_prepare_manual_admin_recovery(UUID,TEXT,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owner_finalize_manual_admin_recovery(UUID,UUID,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_prepare_manual_admin_recovery(UUID,TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_finalize_manual_admin_recovery(UUID,UUID,TEXT,TEXT) TO authenticated;

COMMENT ON FUNCTION public.owner_provision_manual_madrasa_admin(UUID,UUID,BOOLEAN,TEXT) IS
  'Owner-only, MFA-protected atomic tenant provisioning for a server-created MDI internal login identity. Never accepts or returns a password. Applicant contact email remains unverified.';
COMMENT ON FUNCTION public.owner_prepare_manual_admin_recovery(UUID,TEXT,TEXT) IS
  'Owner-only preparation and audit record for explicit manual administrator credential recovery after out-of-band contact verification.';
COMMENT ON FUNCTION public.owner_finalize_manual_admin_recovery(UUID,UUID,TEXT,TEXT) IS
  'Owner-only append-only outcome record for manual administrator credential recovery.';
