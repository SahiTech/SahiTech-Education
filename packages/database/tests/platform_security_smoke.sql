-- Run against an isolated MDI development database after migrations 00001-00023.
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
