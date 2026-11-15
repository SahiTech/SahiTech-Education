-- Migration 00045: owner_direct_setup_madrasa_admin
-- Enables the Global Platform Owner to directly set up and activate madrasa admin accounts
-- without requiring the applicant to go through email confirmation or invitation token hurdles.

CREATE OR REPLACE FUNCTION public.owner_direct_setup_madrasa_admin(
  p_application_id UUID,
  p_initial_password TEXT DEFAULT NULL,
  p_activate_immediately BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'auth', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_app public.madrasa_applications%ROWTYPE;
  v_user_id UUID;
  v_enc_pass TEXT;
  v_is_new_user BOOLEAN := FALSE;
  v_tenant_id UUID;
  v_branch_id UUID;
  v_year_id UUID;
  v_curriculum public.curriculum_type;
  v_pass_to_use TEXT := COALESCE(NULLIF(TRIM(p_initial_password), ''), 'Sahitech@2026!');
BEGIN
  -- 1. Security Check: Must be platform owner or internal system caller
  IF v_owner IS NULL THEN
    SELECT auth_user_id INTO v_owner FROM private.platform_owner LIMIT 1;
  ELSIF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501';
  END IF;

  -- 2. Fetch Application
  SELECT * INTO v_app FROM public.madrasa_applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'application_not_found';
  END IF;

  -- 3. Resolve or Create User in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(v_app.contact_email) LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Existing user: verify email, and update password if custom one provided
    IF p_initial_password IS NOT NULL AND length(TRIM(p_initial_password)) >= 6 THEN
      v_enc_pass := extensions.crypt(TRIM(p_initial_password), extensions.gen_salt('bf', 10));
      UPDATE auth.users
        SET encrypted_password = v_enc_pass,
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('email_verified', true, 'full_name_en', v_app.contact_person_name),
            updated_at = now()
        WHERE id = v_user_id;
    ELSE
      UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('email_verified', true, 'full_name_en', v_app.contact_person_name),
            updated_at = now()
        WHERE id = v_user_id;
    END IF;
  ELSE
    -- New user: create in auth.users and auth.identities
    v_is_new_user := TRUE;
    v_user_id := gen_random_uuid();
    v_enc_pass := extensions.crypt(v_pass_to_use, extensions.gen_salt('bf', 10));

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_user_id,
      'authenticated',
      'authenticated',
      v_app.contact_email,
      v_enc_pass,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', v_user_id,
        'email', v_app.contact_email,
        'full_name_en', v_app.contact_person_name,
        'email_verified', true
      ),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, email,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id,
        'email', v_app.contact_email,
        'full_name_en', v_app.contact_person_name,
        'email_verified', true
      ),
      'email',
      v_user_id::text,
      v_app.contact_email,
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;
  END IF;

  -- 4. Update profile details
  INSERT INTO public.profiles (id, full_name_en, full_name_bn, phone)
  VALUES (v_user_id, v_app.contact_person_name, v_app.contact_person_name, v_app.contact_phone)
  ON CONFLICT (id) DO UPDATE SET
    full_name_en = EXCLUDED.full_name_en,
    full_name_bn = COALESCE(public.profiles.full_name_bn, EXCLUDED.full_name_bn),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone);

  -- 5. Resolve or create Tenant
  SELECT id INTO v_tenant_id FROM public.tenants WHERE source_application_id = v_app.id LIMIT 1;

  v_curriculum := CASE v_app.institution_type
    WHEN 'alia' THEN 'alia'::public.curriculum_type
    WHEN 'hybrid' THEN 'hybrid'::public.curriculum_type
    ELSE 'qawmi'::public.curriculum_type
  END;

  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      name, code, subdomain, curriculum_type, registration_no,
      contact_email, contact_phone, division, district, address,
      is_active, is_verified, onboarding_step, onboarding_completed_at,
      platform_status, source_application_id
    ) VALUES (
      v_app.institution_name, v_app.requested_code, v_app.requested_subdomain,
      v_curriculum, v_app.registration_number,
      v_app.contact_email, v_app.contact_phone, v_app.division, v_app.district, v_app.address,
      CASE WHEN p_activate_immediately THEN TRUE ELSE FALSE END,
      CASE WHEN p_activate_immediately THEN TRUE ELSE FALSE END,
      CASE WHEN p_activate_immediately THEN 6 ELSE 1 END,
      CASE WHEN p_activate_immediately THEN now() ELSE NULL END,
      CASE WHEN p_activate_immediately THEN 'active' ELSE 'pending_activation' END,
      v_app.id
    )
    RETURNING id INTO v_tenant_id;

    INSERT INTO public.branches(tenant_id, name, code, is_main_branch, address, phone)
    VALUES(v_tenant_id, 'প্রধান ক্যাম্পাস (Main Campus)', 'MAIN', TRUE, v_app.address, v_app.contact_phone)
    RETURNING id INTO v_branch_id;

    INSERT INTO public.tenant_users(tenant_id, user_id, branch_id, role, is_active)
    VALUES(v_tenant_id, v_user_id, v_branch_id, 'madrasa_admin', TRUE);

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
  ELSE
    -- Tenant exists: ensure admin membership exists and update status if requested
    SELECT id INTO v_branch_id FROM public.branches WHERE tenant_id = v_tenant_id AND is_main_branch = TRUE LIMIT 1;
    INSERT INTO public.tenant_users(tenant_id, user_id, branch_id, role, is_active)
    VALUES(v_tenant_id, v_user_id, v_branch_id, 'madrasa_admin', TRUE)
    ON CONFLICT (tenant_id, user_id, role) DO UPDATE SET is_active = TRUE;

    IF p_activate_immediately THEN
      UPDATE public.tenants
      SET
        platform_status = 'active',
        is_active = TRUE,
        is_verified = TRUE,
        onboarding_step = 6,
        onboarding_completed_at = COALESCE(onboarding_completed_at, now()),
        updated_at = now()
      WHERE id = v_tenant_id;
    END IF;
  END IF;

  -- 6. Update Application & Invitations
  UPDATE public.madrasa_applications
    SET status = 'approved', reviewed_by = v_owner, reviewed_at = now(), updated_at = now()
    WHERE id = v_app.id;

  UPDATE public.platform_invitations
    SET status = 'accepted', accepted_at = now()
    WHERE application_id = v_app.id AND status IN ('pending', 'sent');

  RETURN jsonb_build_object(
    'success', TRUE,
    'tenant_id', v_tenant_id,
    'user_id', v_user_id,
    'email', v_app.contact_email,
    'institution_name', v_app.institution_name,
    'subdomain', v_app.requested_subdomain,
    'is_new_user', v_is_new_user,
    'activated', p_activate_immediately,
    'password_used', CASE WHEN v_is_new_user OR (p_initial_password IS NOT NULL AND length(TRIM(p_initial_password)) >= 6) THEN v_pass_to_use ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.owner_direct_setup_madrasa_admin(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_direct_setup_madrasa_admin(UUID, TEXT, BOOLEAN) TO service_role;
