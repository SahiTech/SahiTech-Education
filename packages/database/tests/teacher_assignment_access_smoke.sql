-- Read-only catalog smoke test for MDI teacher assignment isolation.
-- Run against an isolated Development project after migrations 00053 and 00054.
DO $$
DECLARE
  v_missing TEXT[];
  v_function_count INTEGER;
  v_table_rls BOOLEAN;
BEGIN
  SELECT array_agg(required.table_name)
    INTO v_missing
  FROM unnest(ARRAY[
    'students','student_enrollments','sections','classes','subjects',
    'attendance_records','exam_marks','class_routines','student_guardians','sanads'
  ]) AS required(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname='public'
      AND p.tablename=required.table_name
      AND p.policyname LIKE 'Teacher assignment scope%'
      AND p.permissive='RESTRICTIVE'
  );
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing restrictive teacher scope policies: %', array_to_string(v_missing, ', ');
  END IF;

  SELECT relrowsecurity INTO v_table_rls
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname='teacher_class_assignments';
  IF COALESCE(v_table_rls,FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'teacher_class_assignments must have RLS enabled';
  END IF;

  IF has_table_privilege('anon','public.teacher_class_assignments','SELECT')
     OR has_table_privilege('anon','public.teacher_class_assignments','INSERT')
     OR has_table_privilege('anon','public.teacher_class_assignments','UPDATE')
     OR has_table_privilege('anon','public.teacher_class_assignments','DELETE') THEN
    RAISE EXCEPTION 'Anonymous role must not access teacher assignments';
  END IF;

  SELECT count(*) INTO v_function_count
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='private'
    AND p.proname IN (
      'mdi_teacher_can_access_section',
      'mdi_teacher_can_access_current_section',
      'mdi_teacher_can_access_current_class',
      'mdi_teacher_can_access_current_subject',
      'mdi_teacher_can_access_student',
      'mdi_teacher_can_access_exam_mark',
      'mdi_teacher_can_access_routine'
    )
    AND p.prosecdef
    AND has_function_privilege('authenticated',p.oid,'EXECUTE')
    AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
    AND position('pg_temp' in array_to_string(p.proconfig,',')) > 0;
  IF v_function_count <> 7 THEN
    RAISE EXCEPTION 'Expected 7 private SECURITY DEFINER teacher predicates with authenticated-only execution and safe search_path; found %', v_function_count;
  END IF;

  IF has_function_privilege('authenticated','private.capture_platform_audit()','EXECUTE')
     OR has_function_privilege('authenticated','private.capture_application_document_review_audit()','EXECUTE')
     OR has_function_privilege('authenticated','private.mark_manual_admin_tenant_flags()','EXECUTE') THEN
    RAISE EXCEPTION 'Trigger-only private functions must not be directly executable by authenticated users';
  END IF;
END;
$$;
