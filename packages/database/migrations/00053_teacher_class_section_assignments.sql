-- MDI 00053: scope teacher access to explicitly assigned academic sections.
-- Existing tenant-wide policies remain for administrators and academic deans.
-- Teachers receive read/write access only to assigned active sections and subjects.

CREATE UNIQUE INDEX IF NOT EXISTS teachers_tenant_id_id_uidx
  ON public.teachers (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS academic_years_tenant_id_id_uidx
  ON public.academic_years (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS sections_tenant_class_id_uidx
  ON public.sections (tenant_id, class_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS subjects_tenant_class_id_uidx
  ON public.subjects (tenant_id, class_id, id);

CREATE TABLE IF NOT EXISTS public.teacher_class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  academic_year_id UUID NOT NULL,
  class_id UUID NOT NULL,
  section_id UUID NOT NULL,
  -- NULL means all subjects in the assigned section/class.
  subject_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT teacher_class_assignments_teacher_fk
    FOREIGN KEY (tenant_id, teacher_id)
    REFERENCES public.teachers (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT teacher_class_assignments_year_fk
    FOREIGN KEY (tenant_id, academic_year_id)
    REFERENCES public.academic_years (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT teacher_class_assignments_section_fk
    FOREIGN KEY (tenant_id, class_id, section_id)
    REFERENCES public.sections (tenant_id, class_id, id) ON DELETE CASCADE,
  CONSTRAINT teacher_class_assignments_subject_fk
    FOREIGN KEY (tenant_id, class_id, subject_id)
    REFERENCES public.subjects (tenant_id, class_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS teacher_class_assignments_teacher_year_idx
  ON public.teacher_class_assignments (tenant_id, teacher_id, academic_year_id)
  WHERE is_active;
CREATE INDEX IF NOT EXISTS teacher_class_assignments_section_year_idx
  ON public.teacher_class_assignments (tenant_id, section_id, academic_year_id)
  WHERE is_active;
CREATE UNIQUE INDEX IF NOT EXISTS teacher_class_assignments_section_all_subjects_uidx
  ON public.teacher_class_assignments (tenant_id, teacher_id, academic_year_id, section_id)
  WHERE is_active AND subject_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS teacher_class_assignments_section_subject_uidx
  ON public.teacher_class_assignments (tenant_id, teacher_id, academic_year_id, section_id, subject_id)
  WHERE is_active AND subject_id IS NOT NULL;

ALTER TABLE public.teacher_class_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.teacher_class_assignments FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_class_assignments TO authenticated;

DROP POLICY IF EXISTS "Teachers can view own academic assignments" ON public.teacher_class_assignments;
CREATE POLICY "Teachers can view own academic assignments"
  ON public.teacher_class_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_class_assignments.teacher_id
        AND t.tenant_id = teacher_class_assignments.tenant_id
        AND t.user_id = (SELECT auth.uid())
        AND t.is_active = TRUE
    )
    OR public.has_tenant_role(
      tenant_id,
      ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role]
    )
  );

DROP POLICY IF EXISTS "Academic admins manage teacher assignments" ON public.teacher_class_assignments;
CREATE POLICY "Academic admins manage teacher assignments"
  ON public.teacher_class_assignments
  FOR ALL TO authenticated
  USING (
    public.has_tenant_role(
      tenant_id,
      ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role]
    )
  )
  WITH CHECK (
    public.has_tenant_role(
      tenant_id,
      ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role]
    )
  );

CREATE OR REPLACE FUNCTION private.mdi_teacher_can_access_section(
  p_tenant_id UUID,
  p_academic_year_id UUID,
  p_section_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, private, pg_temp
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.teacher_class_assignments a
    JOIN public.teachers t
      ON t.id = a.teacher_id AND t.tenant_id = a.tenant_id
    WHERE a.tenant_id = p_tenant_id
      AND a.academic_year_id = p_academic_year_id
      AND a.section_id = p_section_id
      AND a.is_active = TRUE
      AND t.user_id = (SELECT auth.uid())
      AND t.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION private.mdi_teacher_can_access_current_section(
  p_tenant_id UUID,
  p_section_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, private, pg_temp
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.teacher_class_assignments a
    JOIN public.academic_years ay
      ON ay.id = a.academic_year_id AND ay.tenant_id = a.tenant_id AND ay.is_current = TRUE
    JOIN public.teachers t
      ON t.id = a.teacher_id AND t.tenant_id = a.tenant_id
    WHERE a.tenant_id = p_tenant_id
      AND a.section_id = p_section_id
      AND a.is_active = TRUE
      AND t.user_id = (SELECT auth.uid())
      AND t.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION private.mdi_teacher_can_access_current_class(
  p_tenant_id UUID,
  p_class_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, private, pg_temp
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.teacher_class_assignments a
    JOIN public.academic_years ay
      ON ay.id = a.academic_year_id AND ay.tenant_id = a.tenant_id AND ay.is_current = TRUE
    JOIN public.teachers t
      ON t.id = a.teacher_id AND t.tenant_id = a.tenant_id
    WHERE a.tenant_id = p_tenant_id
      AND a.class_id = p_class_id
      AND a.is_active = TRUE
      AND t.user_id = (SELECT auth.uid())
      AND t.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION private.mdi_teacher_can_access_current_subject(
  p_tenant_id UUID,
  p_subject_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, private, pg_temp
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.subjects s
    JOIN public.teacher_class_assignments a
      ON a.tenant_id = s.tenant_id
     AND a.class_id = s.class_id
     AND (a.subject_id IS NULL OR a.subject_id = s.id)
    JOIN public.academic_years ay
      ON ay.id = a.academic_year_id AND ay.tenant_id = a.tenant_id AND ay.is_current = TRUE
    JOIN public.teachers t
      ON t.id = a.teacher_id AND t.tenant_id = a.tenant_id
    WHERE s.tenant_id = p_tenant_id
      AND s.id = p_subject_id
      AND a.is_active = TRUE
      AND t.user_id = (SELECT auth.uid())
      AND t.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION private.mdi_teacher_can_access_student(
  p_tenant_id UUID,
  p_student_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, private, pg_temp
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.student_enrollments e
    JOIN public.teacher_class_assignments a
      ON a.tenant_id = e.tenant_id
     AND a.academic_year_id = e.academic_year_id
     AND a.section_id = e.section_id
     AND a.class_id = e.class_id
     AND a.is_active = TRUE
    JOIN public.teachers t
      ON t.id = a.teacher_id AND t.tenant_id = a.tenant_id
    WHERE e.tenant_id = p_tenant_id
      AND e.student_id = p_student_id
      AND e.is_active = TRUE
      AND t.user_id = (SELECT auth.uid())
      AND t.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION private.mdi_teacher_can_access_exam_mark(
  p_tenant_id UUID,
  p_exam_id UUID,
  p_student_id UUID,
  p_subject_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, private, pg_temp
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.exams ex
    JOIN public.student_enrollments e
      ON e.tenant_id = ex.tenant_id
     AND e.academic_year_id = ex.academic_year_id
     AND e.student_id = p_student_id
     AND e.is_active = TRUE
    JOIN public.subjects s
      ON s.id = p_subject_id
     AND s.tenant_id = ex.tenant_id
     AND s.class_id = e.class_id
    JOIN public.teacher_class_assignments a
      ON a.tenant_id = ex.tenant_id
     AND a.academic_year_id = ex.academic_year_id
     AND a.class_id = e.class_id
     AND a.section_id = e.section_id
     AND (a.subject_id IS NULL OR a.subject_id = s.id)
     AND a.is_active = TRUE
    JOIN public.teachers t
      ON t.id = a.teacher_id AND t.tenant_id = a.tenant_id
    WHERE ex.tenant_id = p_tenant_id
      AND ex.id = p_exam_id
      AND t.user_id = (SELECT auth.uid())
      AND t.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION private.mdi_teacher_can_access_routine(
  p_tenant_id UUID,
  p_class_id UUID,
  p_section_id UUID,
  p_subject_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, private, pg_temp
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.teacher_class_assignments a
    JOIN public.academic_years ay
      ON ay.id = a.academic_year_id AND ay.tenant_id = a.tenant_id AND ay.is_current = TRUE
    JOIN public.teachers t
      ON t.id = a.teacher_id AND t.tenant_id = a.tenant_id
    WHERE a.tenant_id = p_tenant_id
      AND a.class_id = p_class_id
      AND (p_section_id IS NULL OR a.section_id = p_section_id)
      AND (a.subject_id IS NULL OR a.subject_id = p_subject_id)
      AND a.is_active = TRUE
      AND t.user_id = (SELECT auth.uid())
      AND t.is_active = TRUE
  );
$$;

REVOKE ALL ON FUNCTION private.mdi_teacher_can_access_section(UUID, UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.mdi_teacher_can_access_current_section(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.mdi_teacher_can_access_current_class(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.mdi_teacher_can_access_current_subject(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.mdi_teacher_can_access_student(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.mdi_teacher_can_access_exam_mark(UUID, UUID, UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.mdi_teacher_can_access_routine(UUID, UUID, UUID, UUID) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_section(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_current_section(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_current_class(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_current_subject(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_student(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_exam_mark(UUID, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mdi_teacher_can_access_routine(UUID, UUID, UUID, UUID) TO authenticated;

-- Restrictive policies AND with the existing tenant-level policies. Administrators
-- and academic deans retain tenant-wide access; teachers must have an explicit
-- assignment. Teachers do not receive access to guardian identity/contact records
-- or Sanad issuance records merely by belonging to a tenant.

DROP POLICY IF EXISTS "Teacher assignment scope students" ON public.students;
CREATE POLICY "Teacher assignment scope students"
  ON public.students AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_student(tenant_id, id)
  );

DROP POLICY IF EXISTS "Teacher assignment scope enrollments" ON public.student_enrollments;
CREATE POLICY "Teacher assignment scope enrollments"
  ON public.student_enrollments AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_section(tenant_id, academic_year_id, section_id)
  );

DROP POLICY IF EXISTS "Teacher assignment scope sections" ON public.sections;
CREATE POLICY "Teacher assignment scope sections"
  ON public.sections AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_current_section(tenant_id, id)
  );

DROP POLICY IF EXISTS "Teacher assignment scope classes" ON public.classes;
CREATE POLICY "Teacher assignment scope classes"
  ON public.classes AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_current_class(tenant_id, id)
  );

DROP POLICY IF EXISTS "Teacher assignment scope subjects" ON public.subjects;
CREATE POLICY "Teacher assignment scope subjects"
  ON public.subjects AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_current_subject(tenant_id, id)
  );

DROP POLICY IF EXISTS "Teacher assignment scope attendance" ON public.attendance_records;
CREATE POLICY "Teacher assignment scope attendance"
  ON public.attendance_records AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_section(tenant_id, academic_year_id, section_id)
  )
  WITH CHECK (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_section(tenant_id, academic_year_id, section_id)
  );

DROP POLICY IF EXISTS "Teacher assignment scope exam marks" ON public.exam_marks;
CREATE POLICY "Teacher assignment scope exam marks"
  ON public.exam_marks AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_exam_mark(tenant_id, exam_id, student_id, subject_id)
  )
  WITH CHECK (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_exam_mark(tenant_id, exam_id, student_id, subject_id)
  );

DROP POLICY IF EXISTS "Teacher assignment scope routines" ON public.class_routines;
CREATE POLICY "Teacher assignment scope routines"
  ON public.class_routines AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
    OR private.mdi_teacher_can_access_routine(tenant_id, class_id, section_id, subject_id)
  );

DROP POLICY IF EXISTS "Teacher assignment scope guardians" ON public.student_guardians;
CREATE POLICY "Teacher assignment scope guardians"
  ON public.student_guardians AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
  );

DROP POLICY IF EXISTS "Teacher assignment scope sanads" ON public.sanads;
CREATE POLICY "Teacher assignment scope sanads"
  ON public.sanads AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    NOT public.has_tenant_role(tenant_id, ARRAY['teacher'::public.user_role])
    OR public.has_tenant_role(tenant_id, ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role, 'academic_dean'::public.user_role])
  );

COMMENT ON TABLE public.teacher_class_assignments IS
  'Academic-year scoped teacher access grants. A NULL subject_id grants all subjects in the assigned section; assignments are administered by Madrasa Admin or Academic Dean.';
