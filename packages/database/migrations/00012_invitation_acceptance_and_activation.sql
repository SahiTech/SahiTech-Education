-- MDI 00012: complete application invitation lifecycle and enforce deferred tenant activation.
ALTER TABLE public.madrasa_applications
  ADD COLUMN IF NOT EXISTS requested_code TEXT,
  ADD COLUMN IF NOT EXISTS requested_subdomain TEXT;

ALTER TABLE public.madrasa_applications
  ADD CONSTRAINT madrasa_applications_requested_code_format
    CHECK (requested_code IS NULL OR requested_code ~ '^[A-Z0-9][A-Z0-9_-]{1,19}$'),
  ADD CONSTRAINT madrasa_applications_requested_subdomain_format
    CHECK (requested_subdomain IS NULL OR requested_subdomain ~ '^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$');

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS platform_status TEXT NOT NULL DEFAULT 'active'
    CHECK (platform_status IN ('provisioning','pending_activation','active','suspended','closed')),
  ADD COLUMN IF NOT EXISTS source_application_id UUID
    REFERENCES public.madrasa_applications(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_source_application_id_key
  ON public.tenants(source_application_id)
  WHERE source_application_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.owner_issue_invitation(
  p_application_id UUID,
  p_token_hash TEXT,
  p_raw_token TEXT,
  p_invitation_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, extensions, pg_temp
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_app public.madrasa_applications%ROWTYPE;
  v_invitation_id UUID;
BEGIN
  IF v_owner IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;
  IF p_token_hash !~ '^[0-9a-f]{64}$' OR length(p_raw_token) < 40 OR length(p_raw_token) > 160 THEN
    RAISE EXCEPTION 'invalid_invitation_token';
  END IF;
  IF p_invitation_url IS NULL OR length(p_invitation_url) > 2048 OR p_invitation_url !~ '^https://' THEN
    RAISE EXCEPTION 'invalid_invitation_url';
  END IF;

  SELECT * INTO v_app
  FROM public.madrasa_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND OR v_app.status NOT IN ('pending','under_review','info_requested','approved') THEN
    RAISE EXCEPTION 'application_not_invitable';
  END IF;
  IF v_app.requested_code IS NULL OR v_app.requested_subdomain IS NULL THEN
    RAISE EXCEPTION 'application_missing_tenant_identifiers';
  END IF;

  UPDATE public.madrasa_applications
    SET status = 'approved', reviewed_by = v_owner, reviewed_at = now(),
        updated_at = now()
    WHERE id = p_application_id;

  UPDATE public.platform_invitations
    SET status = 'revoked', revoked_at = now()
    WHERE application_id = p_application_id
      AND status IN ('pending','sent');

  INSERT INTO public.platform_invitations (
    application_id, invitee_email, token_hash, status, expires_at, created_by
  ) VALUES (
    p_application_id, v_app.contact_email, p_token_hash, 'sent',
    now() + interval '72 hours', v_owner
  )
  RETURNING id INTO v_invitation_id;

  INSERT INTO public.email_outbox(event_type, recipient_email, payload)
  VALUES (
    'madrasa_invitation',
    v_app.contact_email,
    jsonb_build_object(
      'application_id', p_application_id,
      'invitation_id', v_invitation_id,
      'invitation_url', p_invitation_url,
      'institution_name', v_app.institution_name,
      'expires_at', now() + interval '72 hours'
    )
  );

  RETURN v_invitation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_issue_invitation(UUID,TEXT,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_issue_invitation(UUID,TEXT,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_platform_invitation(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, extensions, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_email TEXT;
  v_email_confirmed_at TIMESTAMPTZ;
  v_inv public.platform_invitations%ROWTYPE;
  v_app public.madrasa_applications%ROWTYPE;
  v_tenant_id UUID;
  v_branch_id UUID;
  v_year_id UUID;
  v_curriculum public.curriculum_type;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF p_token IS NULL OR p_token !~ '^[A-Fa-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_invitation_token';
  END IF;

  SELECT email, email_confirmed_at INTO v_user_email, v_email_confirmed_at
  FROM auth.users WHERE id = v_user_id;
  IF v_email_confirmed_at IS NULL OR v_user_email IS NULL THEN
    RAISE EXCEPTION 'verified_email_required';
  END IF;

  SELECT * INTO v_inv
  FROM public.platform_invitations
  WHERE token_hash = encode(extensions.digest(upper(p_token), 'sha256'), 'hex')
  FOR UPDATE;
  IF NOT FOUND OR v_inv.status NOT IN ('sent','pending') OR v_inv.expires_at <= now() THEN
    RAISE EXCEPTION 'invitation_invalid_expired_or_used';
  END IF;
  IF lower(v_user_email) <> lower(v_inv.invitee_email) THEN
    RAISE EXCEPTION 'invitation_email_mismatch' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_app
  FROM public.madrasa_applications
  WHERE id = v_inv.application_id
  FOR UPDATE;
  IF NOT FOUND OR v_app.status <> 'approved' THEN
    RAISE EXCEPTION 'application_not_approved';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants WHERE source_application_id = v_app.id) THEN
    RAISE EXCEPTION 'application_already_provisioned';
  END IF;

  v_curriculum := CASE v_app.institution_type
    WHEN 'alia' THEN 'alia'::public.curriculum_type
    WHEN 'hybrid' THEN 'hybrid'::public.curriculum_type
    ELSE 'qawmi'::public.curriculum_type
  END;

  INSERT INTO public.tenants (
    name, code, subdomain, curriculum_type, registration_no,
    contact_email, contact_phone, division, district, address,
    is_active, is_verified, onboarding_step, platform_status, source_application_id
  ) VALUES (
    v_app.institution_name, v_app.requested_code, v_app.requested_subdomain,
    v_curriculum, v_app.registration_number,
    v_app.contact_email, v_app.contact_phone, v_app.division, v_app.district, v_app.address,
    FALSE, FALSE, 1, 'pending_activation', v_app.id
  )
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.branches(tenant_id,name,code,is_main_branch,address,phone)
  VALUES(v_tenant_id, 'প্রধান ক্যাম্পাস (Main Campus)', 'MAIN', TRUE, v_app.address, v_app.contact_phone)
  RETURNING id INTO v_branch_id;

  INSERT INTO public.tenant_users(tenant_id,user_id,branch_id,role,is_active)
  VALUES(v_tenant_id,v_user_id,v_branch_id,'madrasa_admin',TRUE);

  INSERT INTO public.academic_years(
    tenant_id,name_bn,name_en,hijri_year,start_date,end_date,is_current
  ) VALUES (
    v_tenant_id,
    'চলতি শিক্ষাবর্ষ',
    'Current Academic Year',
    NULL,
    date_trunc('year', current_date)::date,
    (date_trunc('year', current_date) + interval '1 year - 1 day')::date,
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

  UPDATE public.platform_invitations
    SET status='accepted', accepted_at=now()
    WHERE id=v_inv.id;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'branch_id', v_branch_id,
    'academic_year_id', v_year_id,
    'tenant_status', 'pending_activation',
    'onboarding_required', TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_platform_invitation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_platform_invitation(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_activate_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.tenants
    SET platform_status='active', is_active=TRUE, is_verified=TRUE, updated_at=now()
    WHERE id=p_tenant_id
      AND platform_status='pending_activation'
      AND onboarding_step=6
      AND onboarding_completed_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'tenant_not_ready_for_activation';
  END IF;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_activate_tenant(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_activate_tenant(UUID) TO authenticated;

COMMENT ON FUNCTION public.accept_platform_invitation(TEXT) IS
  'Atomic single-use invitation acceptance. Requires verified matching Auth email and creates a pending-activation tenant with its initial branch, academic year, departments and Madrasa Admin membership.';
