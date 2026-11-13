-- MDI 00027: enforce same-tenant relationships for tenant-owned records.
-- Composite parent indexes are required because the original primary keys are globally unique by id.
CREATE UNIQUE INDEX IF NOT EXISTS academic_years_tenant_id_id_uidx ON public.academic_years(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS sections_tenant_id_id_uidx ON public.sections(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS students_tenant_id_id_uidx ON public.students(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS classes_tenant_id_id_uidx ON public.classes(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS subjects_tenant_id_id_uidx ON public.subjects(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS teachers_tenant_id_id_uidx ON public.teachers(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS departments_tenant_id_id_uidx ON public.departments(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS exams_tenant_id_id_uidx ON public.exams(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS fee_categories_tenant_id_id_uidx ON public.fee_categories(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS hostel_rooms_tenant_id_id_uidx ON public.hostel_rooms(tenant_id,id);

ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_academic_year_id_tenant_scope_fkey FOREIGN KEY (tenant_id,academic_year_id) REFERENCES public.academic_years(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.attendance_records VALIDATE CONSTRAINT attendance_records_academic_year_id_tenant_scope_fkey;

ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_section_id_tenant_scope_fkey FOREIGN KEY (tenant_id,section_id) REFERENCES public.sections(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.attendance_records VALIDATE CONSTRAINT attendance_records_section_id_tenant_scope_fkey;

ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_student_id_tenant_scope_fkey FOREIGN KEY (tenant_id,student_id) REFERENCES public.students(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.attendance_records VALIDATE CONSTRAINT attendance_records_student_id_tenant_scope_fkey;

ALTER TABLE public.class_routines ADD CONSTRAINT class_routines_class_id_tenant_scope_fkey FOREIGN KEY (tenant_id,class_id) REFERENCES public.classes(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.class_routines VALIDATE CONSTRAINT class_routines_class_id_tenant_scope_fkey;

ALTER TABLE public.class_routines ADD CONSTRAINT class_routines_section_id_tenant_scope_fkey FOREIGN KEY (tenant_id,section_id) REFERENCES public.sections(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.class_routines VALIDATE CONSTRAINT class_routines_section_id_tenant_scope_fkey;

ALTER TABLE public.class_routines ADD CONSTRAINT class_routines_subject_id_tenant_scope_fkey FOREIGN KEY (tenant_id,subject_id) REFERENCES public.subjects(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.class_routines VALIDATE CONSTRAINT class_routines_subject_id_tenant_scope_fkey;

ALTER TABLE public.class_routines ADD CONSTRAINT class_routines_teacher_id_tenant_scope_fkey FOREIGN KEY (tenant_id,teacher_id) REFERENCES public.teachers(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.class_routines VALIDATE CONSTRAINT class_routines_teacher_id_tenant_scope_fkey;

ALTER TABLE public.classes ADD CONSTRAINT classes_department_id_tenant_scope_fkey FOREIGN KEY (tenant_id,department_id) REFERENCES public.departments(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.classes VALIDATE CONSTRAINT classes_department_id_tenant_scope_fkey;

ALTER TABLE public.exam_marks ADD CONSTRAINT exam_marks_exam_id_tenant_scope_fkey FOREIGN KEY (tenant_id,exam_id) REFERENCES public.exams(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.exam_marks VALIDATE CONSTRAINT exam_marks_exam_id_tenant_scope_fkey;

ALTER TABLE public.exam_marks ADD CONSTRAINT exam_marks_student_id_tenant_scope_fkey FOREIGN KEY (tenant_id,student_id) REFERENCES public.students(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.exam_marks VALIDATE CONSTRAINT exam_marks_student_id_tenant_scope_fkey;

ALTER TABLE public.exam_marks ADD CONSTRAINT exam_marks_subject_id_tenant_scope_fkey FOREIGN KEY (tenant_id,subject_id) REFERENCES public.subjects(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.exam_marks VALIDATE CONSTRAINT exam_marks_subject_id_tenant_scope_fkey;

ALTER TABLE public.exams ADD CONSTRAINT exams_academic_year_id_tenant_scope_fkey FOREIGN KEY (tenant_id,academic_year_id) REFERENCES public.academic_years(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.exams VALIDATE CONSTRAINT exams_academic_year_id_tenant_scope_fkey;

ALTER TABLE public.fee_invoices ADD CONSTRAINT fee_invoices_fee_category_id_tenant_scope_fkey FOREIGN KEY (tenant_id,fee_category_id) REFERENCES public.fee_categories(tenant_id,id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public.fee_invoices VALIDATE CONSTRAINT fee_invoices_fee_category_id_tenant_scope_fkey;

ALTER TABLE public.fee_invoices ADD CONSTRAINT fee_invoices_student_id_tenant_scope_fkey FOREIGN KEY (tenant_id,student_id) REFERENCES public.students(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.fee_invoices VALIDATE CONSTRAINT fee_invoices_student_id_tenant_scope_fkey;

ALTER TABLE public.hostel_allocations ADD CONSTRAINT hostel_allocations_room_id_tenant_scope_fkey FOREIGN KEY (tenant_id,room_id) REFERENCES public.hostel_rooms(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.hostel_allocations VALIDATE CONSTRAINT hostel_allocations_room_id_tenant_scope_fkey;

ALTER TABLE public.hostel_allocations ADD CONSTRAINT hostel_allocations_student_id_tenant_scope_fkey FOREIGN KEY (tenant_id,student_id) REFERENCES public.students(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.hostel_allocations VALIDATE CONSTRAINT hostel_allocations_student_id_tenant_scope_fkey;

ALTER TABLE public.lillah_evaluations ADD CONSTRAINT lillah_evaluations_student_id_tenant_scope_fkey FOREIGN KEY (tenant_id,student_id) REFERENCES public.students(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.lillah_evaluations VALIDATE CONSTRAINT lillah_evaluations_student_id_tenant_scope_fkey;

ALTER TABLE public.sanads ADD CONSTRAINT sanads_academic_year_id_tenant_scope_fkey FOREIGN KEY (tenant_id,academic_year_id) REFERENCES public.academic_years(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.sanads VALIDATE CONSTRAINT sanads_academic_year_id_tenant_scope_fkey;

ALTER TABLE public.sanads ADD CONSTRAINT sanads_class_id_tenant_scope_fkey FOREIGN KEY (tenant_id,class_id) REFERENCES public.classes(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.sanads VALIDATE CONSTRAINT sanads_class_id_tenant_scope_fkey;

ALTER TABLE public.sanads ADD CONSTRAINT sanads_student_id_tenant_scope_fkey FOREIGN KEY (tenant_id,student_id) REFERENCES public.students(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.sanads VALIDATE CONSTRAINT sanads_student_id_tenant_scope_fkey;

ALTER TABLE public.sections ADD CONSTRAINT sections_class_id_tenant_scope_fkey FOREIGN KEY (tenant_id,class_id) REFERENCES public.classes(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.sections VALIDATE CONSTRAINT sections_class_id_tenant_scope_fkey;

ALTER TABLE public.staff_leaves ADD CONSTRAINT staff_leaves_teacher_id_tenant_scope_fkey FOREIGN KEY (tenant_id,teacher_id) REFERENCES public.teachers(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.staff_leaves VALIDATE CONSTRAINT staff_leaves_teacher_id_tenant_scope_fkey;

ALTER TABLE public.student_enrollments ADD CONSTRAINT student_enrollments_academic_year_id_tenant_scope_fkey FOREIGN KEY (tenant_id,academic_year_id) REFERENCES public.academic_years(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.student_enrollments VALIDATE CONSTRAINT student_enrollments_academic_year_id_tenant_scope_fkey;

ALTER TABLE public.student_enrollments ADD CONSTRAINT student_enrollments_class_id_tenant_scope_fkey FOREIGN KEY (tenant_id,class_id) REFERENCES public.classes(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.student_enrollments VALIDATE CONSTRAINT student_enrollments_class_id_tenant_scope_fkey;

ALTER TABLE public.student_enrollments ADD CONSTRAINT student_enrollments_section_id_tenant_scope_fkey FOREIGN KEY (tenant_id,section_id) REFERENCES public.sections(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.student_enrollments VALIDATE CONSTRAINT student_enrollments_section_id_tenant_scope_fkey;

ALTER TABLE public.student_enrollments ADD CONSTRAINT student_enrollments_student_id_tenant_scope_fkey FOREIGN KEY (tenant_id,student_id) REFERENCES public.students(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.student_enrollments VALIDATE CONSTRAINT student_enrollments_student_id_tenant_scope_fkey;

ALTER TABLE public.student_guardians ADD CONSTRAINT student_guardians_student_id_tenant_scope_fkey FOREIGN KEY (tenant_id,student_id) REFERENCES public.students(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.student_guardians VALIDATE CONSTRAINT student_guardians_student_id_tenant_scope_fkey;

ALTER TABLE public.subjects ADD CONSTRAINT subjects_class_id_tenant_scope_fkey FOREIGN KEY (tenant_id,class_id) REFERENCES public.classes(tenant_id,id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.subjects VALIDATE CONSTRAINT subjects_class_id_tenant_scope_fkey;

COMMENT ON INDEX public.students_tenant_id_id_uidx IS 'Supports composite tenant-aware foreign keys that prevent cross-tenant student references.';
