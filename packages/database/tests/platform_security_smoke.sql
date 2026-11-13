-- Run against an isolated MDI development database after migrations 00001-00029.
-- This file is read-only and intentionally contains no fixtures or persistent writes.
DO $$
BEGIN
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') <> 37 THEN
    RAISE EXCEPTION 'Expected 37 public tables in clean dev baseline';
  END IF;
  IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity) <> 37 THEN
    RAISE EXCEPTION 'RLS is not enabled on every public table';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_guardians' AND policyname='Public admission guardian submission') THEN
    RAISE EXCEPTION 'Unsafe public guardian insert policy still exists';
  END IF;
  IF has_table_privilege('anon','public.madrasa_applications','SELECT')
     OR has_table_privilege('anon','public.madrasa_applications','INSERT') THEN
    RAISE EXCEPTION 'Direct Madrasa application table access must be denied to anon';
  END IF;
  IF NOT has_function_privilege('anon','public.submit_madrasa_application(jsonb,text)','EXECUTE') THEN
    RAISE EXCEPTION 'Validated public application submission RPC is not executable by anon';
  END IF;
  IF has_table_privilege('anon','public.madrasa_application_documents','SELECT')
     OR has_table_privilege('anon','public.madrasa_application_documents','INSERT') THEN
    RAISE EXCEPTION 'Application document metadata is exposed to anon';
  END IF;
  IF NOT has_function_privilege('anon','public.register_madrasa_application_document(uuid,text,text,text,text,text,bigint)','EXECUTE') THEN
    RAISE EXCEPTION 'Capability-checked document registration RPC is not executable by anon';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='madrasa-application-documents' AND public=false) THEN
    RAISE EXCEPTION 'Private application document bucket is missing';
  END IF;
  IF has_table_privilege('authenticated','public.email_outbox','SELECT')
     OR has_table_privilege('authenticated','public.email_outbox','INSERT') THEN
    RAISE EXCEPTION 'Email outbox is exposed to authenticated users';
  END IF;
  IF has_table_privilege('anon','public.tenants','UPDATE')
     OR has_table_privilege('anon','public.tenants','DELETE')
     OR has_table_privilege('anon','public.tenants','TRUNCATE')
     OR has_table_privilege('authenticated','public.tenants','TRUNCATE') THEN
    RAISE EXCEPTION 'Anonymous mutation or RLS-bypassing table privileges remain';
  END IF;
  IF NOT has_table_privilege('anon','public.student_admissions','INSERT') THEN
    RAISE EXCEPTION 'Public student admission submission grant was unintentionally removed';
  END IF;
  IF has_table_privilege('anon','public.madrasa_applications','INSERT') THEN
    RAISE EXCEPTION 'Direct public Madrasa application table insert must remain revoked';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Tenant Admins Can Upload Assets') THEN
    RAISE EXCEPTION 'Legacy broad Storage upload policy remains';
  END IF;
  IF (SELECT public FROM storage.buckets WHERE id='sanad-documents') IS DISTINCT FROM FALSE
     OR (SELECT public FROM storage.buckets WHERE id='student-documents') IS DISTINCT FROM FALSE THEN
    RAISE EXCEPTION 'Sensitive document buckets must remain private';
  END IF;
  IF EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id='madrasa-assets' AND 'image/svg+xml'=ANY(allowed_mime_types)
  ) THEN
    RAISE EXCEPTION 'Public branding bucket must not accept active SVG files';
  END IF;
  IF has_function_privilege('anon','public.handle_new_user()','EXECUTE') THEN
    RAISE EXCEPTION 'Auth trigger function remains callable as anon';
  END IF;
  IF (SELECT count(*) FROM private.platform_owner WHERE singleton AND owner_email='helpline.sahitech@gmail.com') <> 1 THEN
    RAISE EXCEPTION 'Singleton Global Platform Owner seed missing';
  END IF;
  IF EXISTS (SELECT 1 FROM public.tenant_users WHERE role='super_admin') THEN
    RAISE EXCEPTION 'Legacy super_admin tenant membership must not exist';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='tenants'
      AND t.tgname='guard_tenant_platform_lifecycle' AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Tenant lifecycle guard trigger is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='tenant_users'
      AND t.tgname='reject_legacy_super_admin_membership' AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Legacy tenant role guard trigger is missing';
  END IF;
  IF has_table_privilege('anon','public.platform_audit_logs','SELECT')
     OR NOT has_table_privilege('authenticated','public.platform_audit_logs','SELECT') THEN
    RAISE EXCEPTION 'Platform audit table grants are incorrect';
  END IF;
  IF has_table_privilege('authenticated','public.platform_audit_logs','INSERT')
     OR has_table_privilege('authenticated','public.platform_audit_logs','UPDATE')
     OR has_table_privilege('authenticated','public.platform_audit_logs','DELETE') THEN
    RAISE EXCEPTION 'Platform audit log must be read-only to clients';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='platform_audit_logs'
      AND t.tgname='platform_audit_logs_immutable' AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Append-only platform audit guard is missing';
  END IF;
  IF public.is_platform_owner() THEN
    RAISE EXCEPTION 'Owner authorization unexpectedly granted without an authenticated AAL2 session';
  END IF;
  IF (SELECT count(*) FROM public.verify_sanad_public(repeat('0',64))) <> 0 THEN
    RAISE EXCEPTION 'Invalid Sanad token unexpectedly verified';
  END IF;
END;
$$;


-- Cross-tenant references must fail even when the caller supplies a valid foreign row id.
BEGIN;
DO $$
DECLARE
  tenant_a UUID;
  tenant_b UUID;
  department_a UUID;
  department_b UUID;
  class_b UUID;
BEGIN
  INSERT INTO public.tenants(name,code,curriculum_type,is_active,is_verified,platform_status)
  VALUES('Tenant FK Test A','FK-'||substr(gen_random_uuid()::text,1,8),'qawmi',FALSE,FALSE,'pending_activation')
  RETURNING id INTO tenant_a;
  INSERT INTO public.tenants(name,code,curriculum_type,is_active,is_verified,platform_status)
  VALUES('Tenant FK Test B','FK-'||substr(gen_random_uuid()::text,1,8),'qawmi',FALSE,FALSE,'pending_activation')
  RETURNING id INTO tenant_b;

  INSERT INTO public.departments(tenant_id,name_bn,name_en,code,curriculum_type)
  VALUES(tenant_a,'বিভাগ A','Department A','DPA','qawmi') RETURNING id INTO department_a;
  INSERT INTO public.departments(tenant_id,name_bn,name_en,code,curriculum_type)
  VALUES(tenant_b,'বিভাগ B','Department B','DPB','qawmi') RETURNING id INTO department_b;

  INSERT INTO public.classes(tenant_id,department_id,name_bn,name_en,code)
  VALUES(tenant_a,department_a,'শ্রেণি A','Class A','CLA');
  INSERT INTO public.classes(tenant_id,department_id,name_bn,name_en,code)
  VALUES(tenant_b,department_b,'শ্রেণি B','Class B','CLB') RETURNING id INTO class_b;

  BEGIN
    INSERT INTO public.sections(tenant_id,class_id,name)
    VALUES(tenant_a,class_b,'Cross Tenant Attempt');
    RAISE EXCEPTION 'Cross-tenant section reference unexpectedly accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
END;
$$;
ROLLBACK;
