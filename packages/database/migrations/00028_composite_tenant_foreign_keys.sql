-- MDI 00028: replace redundant single-column references with tenant-aware composite FKs.
-- Migrations 00027 already added and validated the 28 non-null tenant relationships.
-- This migration removes redundant single-column constraints and adds the remaining nullable relationships.
CREATE UNIQUE INDEX IF NOT EXISTS branches_tenant_id_id_uidx ON public.branches(tenant_id,id);

ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_academic_year_id_fkey;
ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_section_id_fkey;
ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;
ALTER TABLE public.class_routines DROP CONSTRAINT IF EXISTS class_routines_class_id_fkey;
ALTER TABLE public.class_routines DROP CONSTRAINT IF EXISTS class_routines_section_id_fkey;
ALTER TABLE public.class_routines DROP CONSTRAINT IF EXISTS class_routines_subject_id_fkey;
ALTER TABLE public.class_routines DROP CONSTRAINT IF EXISTS class_routines_teacher_id_fkey;
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_department_id_fkey;
ALTER TABLE public.exam_marks DROP CONSTRAINT IF EXISTS exam_marks_exam_id_fkey;
ALTER TABLE public.exam_marks DROP CONSTRAINT IF EXISTS exam_marks_student_id_fkey;
ALTER TABLE public.exam_marks DROP CONSTRAINT IF EXISTS exam_marks_subject_id_fkey;
ALTER TABLE public.exam_marks DROP CONSTRAINT IF EXISTS exam_marks_evaluator_teacher_id_fkey;
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_academic_year_id_fkey;
ALTER TABLE public.fee_invoices DROP CONSTRAINT IF EXISTS fee_invoices_fee_category_id_fkey;
ALTER TABLE public.fee_invoices DROP CONSTRAINT IF EXISTS fee_invoices_student_id_fkey;
ALTER TABLE public.hostel_allocations DROP CONSTRAINT IF EXISTS hostel_allocations_room_id_fkey;
ALTER TABLE public.hostel_allocations DROP CONSTRAINT IF EXISTS hostel_allocations_student_id_fkey;
ALTER TABLE public.hostel_rooms DROP CONSTRAINT IF EXISTS hostel_rooms_branch_id_fkey;
ALTER TABLE public.lillah_evaluations DROP CONSTRAINT IF EXISTS lillah_evaluations_student_id_fkey;
ALTER TABLE public.sanads DROP CONSTRAINT IF EXISTS sanads_academic_year_id_fkey;
ALTER TABLE public.sanads DROP CONSTRAINT IF EXISTS sanads_class_id_fkey;
ALTER TABLE public.sanads DROP CONSTRAINT IF EXISTS sanads_student_id_fkey;
ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_branch_id_fkey;
ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_class_id_fkey;
ALTER TABLE public.staff_leaves DROP CONSTRAINT IF EXISTS staff_leaves_teacher_id_fkey;
ALTER TABLE public.student_admissions DROP CONSTRAINT IF EXISTS student_admissions_enrolled_student_id_fkey;
ALTER TABLE public.student_admissions DROP CONSTRAINT IF EXISTS student_admissions_target_academic_year_id_fkey;
ALTER TABLE public.student_admissions DROP CONSTRAINT IF EXISTS student_admissions_target_class_id_fkey;
ALTER TABLE public.student_enrollments DROP CONSTRAINT IF EXISTS student_enrollments_academic_year_id_fkey;
ALTER TABLE public.student_enrollments DROP CONSTRAINT IF EXISTS student_enrollments_class_id_fkey;
ALTER TABLE public.student_enrollments DROP CONSTRAINT IF EXISTS student_enrollments_section_id_fkey;
ALTER TABLE public.student_enrollments DROP CONSTRAINT IF EXISTS student_enrollments_student_id_fkey;
ALTER TABLE public.student_guardians DROP CONSTRAINT IF EXISTS student_guardians_student_id_fkey;
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_class_id_fkey;
ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_branch_id_fkey;

CREATE INDEX IF NOT EXISTS attendance_records_tenant_academic_year_id_idx ON public.attendance_records(tenant_id,academic_year_id);
CREATE INDEX IF NOT EXISTS attendance_records_tenant_section_id_idx ON public.attendance_records(tenant_id,section_id);
CREATE INDEX IF NOT EXISTS attendance_records_tenant_student_id_idx ON public.attendance_records(tenant_id,student_id);
CREATE INDEX IF NOT EXISTS class_routines_tenant_class_id_idx ON public.class_routines(tenant_id,class_id);
CREATE INDEX IF NOT EXISTS class_routines_tenant_section_id_idx ON public.class_routines(tenant_id,section_id);
CREATE INDEX IF NOT EXISTS class_routines_tenant_subject_id_idx ON public.class_routines(tenant_id,subject_id);
CREATE INDEX IF NOT EXISTS class_routines_tenant_teacher_id_idx ON public.class_routines(tenant_id,teacher_id);
CREATE INDEX IF NOT EXISTS classes_tenant_department_id_idx ON public.classes(tenant_id,department_id);
CREATE INDEX IF NOT EXISTS exam_marks_tenant_exam_id_idx ON public.exam_marks(tenant_id,exam_id);
CREATE INDEX IF NOT EXISTS exam_marks_tenant_student_id_idx ON public.exam_marks(tenant_id,student_id);
CREATE INDEX IF NOT EXISTS exam_marks_tenant_subject_id_idx ON public.exam_marks(tenant_id,subject_id);
CREATE INDEX IF NOT EXISTS exam_marks_tenant_evaluator_teacher_id_idx ON public.exam_marks(tenant_id,evaluator_teacher_id);
CREATE INDEX IF NOT EXISTS exams_tenant_academic_year_id_idx ON public.exams(tenant_id,academic_year_id);
CREATE INDEX IF NOT EXISTS fee_invoices_tenant_fee_category_id_idx ON public.fee_invoices(tenant_id,fee_category_id);
CREATE INDEX IF NOT EXISTS fee_invoices_tenant_student_id_idx ON public.fee_invoices(tenant_id,student_id);
CREATE INDEX IF NOT EXISTS hostel_allocations_tenant_room_id_idx ON public.hostel_allocations(tenant_id,room_id);
CREATE INDEX IF NOT EXISTS hostel_allocations_tenant_student_id_idx ON public.hostel_allocations(tenant_id,student_id);
CREATE INDEX IF NOT EXISTS hostel_rooms_tenant_branch_id_idx ON public.hostel_rooms(tenant_id,branch_id);
CREATE INDEX IF NOT EXISTS lillah_evaluations_tenant_student_id_idx ON public.lillah_evaluations(tenant_id,student_id);
CREATE INDEX IF NOT EXISTS sanads_tenant_academic_year_id_idx ON public.sanads(tenant_id,academic_year_id);
CREATE INDEX IF NOT EXISTS sanads_tenant_class_id_idx ON public.sanads(tenant_id,class_id);
CREATE INDEX IF NOT EXISTS sanads_tenant_student_id_idx ON public.sanads(tenant_id,student_id);
CREATE INDEX IF NOT EXISTS sections_tenant_branch_id_idx ON public.sections(tenant_id,branch_id);
CREATE INDEX IF NOT EXISTS sections_tenant_class_id_idx ON public.sections(tenant_id,class_id);
CREATE INDEX IF NOT EXISTS staff_leaves_tenant_teacher_id_idx ON public.staff_leaves(tenant_id,teacher_id);
CREATE INDEX IF NOT EXISTS student_admissions_tenant_enrolled_student_id_idx ON public.student_admissions(tenant_id,enrolled_student_id);
CREATE INDEX IF NOT EXISTS student_admissions_tenant_target_academic_year_id_idx ON public.student_admissions(tenant_id,target_academic_year_id);
CREATE INDEX IF NOT EXISTS student_admissions_tenant_target_class_id_idx ON public.student_admissions(tenant_id,target_class_id);
CREATE INDEX IF NOT EXISTS student_enrollments_tenant_academic_year_id_idx ON public.student_enrollments(tenant_id,academic_year_id);
CREATE INDEX IF NOT EXISTS student_enrollments_tenant_class_id_idx ON public.student_enrollments(tenant_id,class_id);
CREATE INDEX IF NOT EXISTS student_enrollments_tenant_section_id_idx ON public.student_enrollments(tenant_id,section_id);
CREATE INDEX IF NOT EXISTS student_enrollments_tenant_student_id_idx ON public.student_enrollments(tenant_id,student_id);
CREATE INDEX IF NOT EXISTS student_guardians_tenant_student_id_idx ON public.student_guardians(tenant_id,student_id);
CREATE INDEX IF NOT EXISTS subjects_tenant_class_id_idx ON public.subjects(tenant_id,class_id);
CREATE INDEX IF NOT EXISTS tenant_users_tenant_branch_id_idx ON public.tenant_users(tenant_id,branch_id);

ALTER TABLE public.exam_marks ADD CONSTRAINT exam_marks_evaluator_teacher_id_tenant_scope_fkey FOREIGN KEY (tenant_id,evaluator_teacher_id) REFERENCES public.teachers(tenant_id,id) ON DELETE SET NULL (evaluator_teacher_id) NOT VALID;
ALTER TABLE public.exam_marks VALIDATE CONSTRAINT exam_marks_evaluator_teacher_id_tenant_scope_fkey;

ALTER TABLE public.hostel_rooms ADD CONSTRAINT hostel_rooms_branch_id_tenant_scope_fkey FOREIGN KEY (tenant_id,branch_id) REFERENCES public.branches(tenant_id,id) ON DELETE SET NULL (branch_id) NOT VALID;
ALTER TABLE public.hostel_rooms VALIDATE CONSTRAINT hostel_rooms_branch_id_tenant_scope_fkey;

ALTER TABLE public.sections ADD CONSTRAINT sections_branch_id_tenant_scope_fkey FOREIGN KEY (tenant_id,branch_id) REFERENCES public.branches(tenant_id,id) ON DELETE SET NULL (branch_id) NOT VALID;
ALTER TABLE public.sections VALIDATE CONSTRAINT sections_branch_id_tenant_scope_fkey;

ALTER TABLE public.student_admissions ADD CONSTRAINT student_admissions_enrolled_student_id_tenant_scope_fkey FOREIGN KEY (tenant_id,enrolled_student_id) REFERENCES public.students(tenant_id,id) ON DELETE SET NULL (enrolled_student_id) NOT VALID;
ALTER TABLE public.student_admissions VALIDATE CONSTRAINT student_admissions_enrolled_student_id_tenant_scope_fkey;

ALTER TABLE public.student_admissions ADD CONSTRAINT student_admissions_target_academic_year_id_tenant_scope_fkey FOREIGN KEY (tenant_id,target_academic_year_id) REFERENCES public.academic_years(tenant_id,id) ON DELETE SET NULL (target_academic_year_id) NOT VALID;
ALTER TABLE public.student_admissions VALIDATE CONSTRAINT student_admissions_target_academic_year_id_tenant_scope_fkey;

ALTER TABLE public.student_admissions ADD CONSTRAINT student_admissions_target_class_id_tenant_scope_fkey FOREIGN KEY (tenant_id,target_class_id) REFERENCES public.classes(tenant_id,id) ON DELETE SET NULL (target_class_id) NOT VALID;
ALTER TABLE public.student_admissions VALIDATE CONSTRAINT student_admissions_target_class_id_tenant_scope_fkey;

ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_branch_id_tenant_scope_fkey FOREIGN KEY (tenant_id,branch_id) REFERENCES public.branches(tenant_id,id) ON DELETE SET NULL (branch_id) NOT VALID;
ALTER TABLE public.tenant_users VALIDATE CONSTRAINT tenant_users_branch_id_tenant_scope_fkey;
