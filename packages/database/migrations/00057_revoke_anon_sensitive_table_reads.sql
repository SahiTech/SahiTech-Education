-- MDI 00057: remove unnecessary anonymous reads from sensitive tenant tables.
-- Public Sanad verification remains available through the minimal SECURITY DEFINER RPC.
REVOKE SELECT ON TABLE
  public.academic_years,
  public.accounts,
  public.attendance_records,
  public.audit_logs,
  public.communication_logs,
  public.exam_marks,
  public.exams,
  public.fee_categories,
  public.fee_invoices,
  public.hostel_allocations,
  public.hostel_rooms,
  public.journal_entries,
  public.journal_entry_lines,
  public.lillah_evaluations,
  public.profiles,
  public.sanads,
  public.staff_leaves,
  public.student_enrollments,
  public.student_guardians,
  public.students,
  public.teachers,
  public.tenant_users
FROM anon;
