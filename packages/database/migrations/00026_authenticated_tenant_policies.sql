-- MDI 00026: make tenant mutation policies authenticated-only and minimize anonymous grants.
ALTER POLICY "Academic admins can manage academic years" ON public.academic_years TO authenticated;
ALTER POLICY "Bursars and admins can manage accounts" ON public.accounts TO authenticated;
ALTER POLICY "Teachers and academic staff can manage attendance" ON public.attendance_records TO authenticated;
ALTER POLICY "Audit logs insertable by members" ON public.audit_logs TO authenticated;
ALTER POLICY "Admins can manage branches" ON public.branches TO authenticated;
ALTER POLICY "Academic admins can manage routines" ON public.class_routines TO authenticated;
ALTER POLICY "Academic admins can manage classes" ON public.classes TO authenticated;
ALTER POLICY "Communication logs insertable by admins" ON public.communication_logs TO authenticated;
ALTER POLICY "Academic admins can manage departments" ON public.departments TO authenticated;
ALTER POLICY "Teachers and academic staff can manage marks" ON public.exam_marks TO authenticated;
ALTER POLICY "Academic admins can manage exams" ON public.exams TO authenticated;
ALTER POLICY "Bursars can manage fee categories" ON public.fee_categories TO authenticated;
ALTER POLICY "Bursars can manage fee invoices" ON public.fee_invoices TO authenticated;
ALTER POLICY "Warden and admins can manage hostel allocations" ON public.hostel_allocations TO authenticated;
ALTER POLICY "Warden and admins can manage hostel rooms" ON public.hostel_rooms TO authenticated;
ALTER POLICY "Bursars and admins can manage journal entries" ON public.journal_entries TO authenticated;
ALTER POLICY "Bursars and admins can manage journal entry lines" ON public.journal_entry_lines TO authenticated;
ALTER POLICY "Admins can manage lillah evaluations" ON public.lillah_evaluations TO authenticated;
ALTER POLICY "Users can update own profile" ON public.profiles TO authenticated;
ALTER POLICY "Admins and deans can manage sanads" ON public.sanads TO authenticated;
ALTER POLICY "Academic admins can manage sections" ON public.sections TO authenticated;
ALTER POLICY "Teachers can submit leaves and admins approve" ON public.staff_leaves TO authenticated;
ALTER POLICY "Admins and deans can manage admissions" ON public.student_admissions TO authenticated;
ALTER POLICY "Academic admins can manage enrollments" ON public.student_enrollments TO authenticated;
ALTER POLICY "Admins and deans can manage guardians" ON public.student_guardians TO authenticated;
ALTER POLICY "Admins and deans can manage students" ON public.students TO authenticated;
ALTER POLICY "Academic admins can manage subjects" ON public.subjects TO authenticated;
ALTER POLICY "Admins can manage teachers" ON public.teachers TO authenticated;
ALTER POLICY "Admins can manage notices" ON public.tenant_notices TO authenticated;
ALTER POLICY "Admins can manage pages" ON public.tenant_pages TO authenticated;
ALTER POLICY "Admins can manage tenant users" ON public.tenant_users TO authenticated;
ALTER POLICY "Admins can update tenant settings" ON public.tenants TO authenticated;

-- Public admission submission remains the only anonymous row-mutation workflow.
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
GRANT INSERT ON public.student_admissions TO anon;
