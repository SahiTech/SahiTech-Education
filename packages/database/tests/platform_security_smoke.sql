-- Run against an isolated MDI development database after migrations 00001-00011.
-- This file is read-only and intentionally contains no fixtures or persistent writes.
DO $$
BEGIN
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') <> 36 THEN
    RAISE EXCEPTION 'Expected 36 public tables in clean dev baseline';
  END IF;
  IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity) <> 36 THEN
    RAISE EXCEPTION 'RLS is not enabled on every public table';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_guardians' AND policyname='Public admission guardian submission') THEN
    RAISE EXCEPTION 'Unsafe public guardian insert policy still exists';
  END IF;
  IF has_table_privilege('anon','public.madrasa_applications','SELECT')
     OR NOT has_table_privilege('anon','public.madrasa_applications','INSERT') THEN
    RAISE EXCEPTION 'Madrasa application anon grants are incorrect';
  END IF;
  IF has_table_privilege('anon','public.madrasa_application_documents','SELECT')
     OR has_table_privilege('anon','public.madrasa_application_documents','INSERT') THEN
    RAISE EXCEPTION 'Application document metadata is exposed to anon';
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
  IF public.is_platform_owner() THEN
    RAISE EXCEPTION 'Owner authorization unexpectedly granted without an authenticated AAL2 session';
  END IF;
  IF (SELECT count(*) FROM public.verify_sanad_public(repeat('0',64))) <> 0 THEN
    RAISE EXCEPTION 'Invalid Sanad token unexpectedly verified';
  END IF;
END;
$$;
