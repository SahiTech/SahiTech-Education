import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { AttendanceView } from './attendance-view';
import { getServerDictionary } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const dict = await getServerDictionary();
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        {dict.attendance.subtitle}
      </div>
    );
  }

  const supabase = await createClient();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const [{ data: currentYear }, sectionsRes] = await Promise.all([
    supabase.from('academic_years').select('id').eq('tenant_id', context.tenantId).eq('is_current', true).maybeSingle(),
    supabase.from('sections').select('id, name, classes:class_id (name_bn, name_en)').eq('tenant_id', context.tenantId),
  ]);

  const sections = (sectionsRes.data || []).map((section: any) => ({
    id: section.id,
    name_bn: section.name,
    class_name_bn: section.classes?.name_bn || '',
    class_name_en: section.classes?.name_en || '',
  }));

  let students: Array<{ id: string; full_name_bn: string; full_name_en: string; admission_no: string; section_id: string }> = [];
  let initialRecords: Array<{ student_id: string; status: string; remark: string | null }> = [];

  if (currentYear?.id) {
    const [enrollmentsRes, recordsRes] = await Promise.all([
      supabase
        .from('student_enrollments')
        .select('student_id, section_id')
        .eq('tenant_id', context.tenantId)
        .eq('academic_year_id', currentYear.id)
        .eq('is_active', true),
      supabase
        .from('attendance_records')
        .select('student_id, status, remark')
        .eq('tenant_id', context.tenantId)
        .eq('academic_year_id', currentYear.id)
        .eq('attendance_date', today),
    ]);

    initialRecords = recordsRes.data || [];
    const enrollmentRows = enrollmentsRes.data || [];
    const studentIds = [...new Set(enrollmentRows.map((row) => row.student_id))];

    if (studentIds.length) {
      const { data: studentRows } = await supabase
        .from('students')
        .select('id, full_name_bn, full_name_en, admission_no, is_active')
        .eq('tenant_id', context.tenantId)
        .eq('is_active', true)
        .in('id', studentIds);

      const sectionByStudent = new Map<string, string>();
      enrollmentRows.forEach((row) => {
        if (!sectionByStudent.has(row.student_id)) sectionByStudent.set(row.student_id, row.section_id);
      });

      students = (studentRows || []).flatMap((student) => {
        const sectionId = sectionByStudent.get(student.id);
        return sectionId ? [{ ...student, section_id: sectionId }] : [];
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{dict.attendance.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{context.tenantName} · {dict.attendance.subtitle}</p>
        </div>
      </div>
      {!currentYear?.id && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{dict.attendance.noCurrentYear || dict.attendance.subtitle}</p>
      )}
      <AttendanceView students={students} sections={sections} initialRecords={initialRecords} />
    </div>
  );
}
