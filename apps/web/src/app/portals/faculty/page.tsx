import React from 'react';
import Link from 'next/link';
import { requirePermission } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle, Clock, Calendar, Users } from 'lucide-react';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function FacultyPortalPage() {
  const [context, dict, locale, direction] = await Promise.all([
    requirePermission('record_attendance'),
    getServerDictionary(),
    getServerLocale(),
    getServerDirection(),
  ]);
  const copy = dict.portals.faculty;
  const supabase = await createClient();

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const { data: currentYear } = await supabase
    .from('academic_years')
    .select('id')
    .eq('tenant_id', context.tenantId)
    .eq('is_current', true)
    .maybeSingle();

  let students: Array<{
    id: string;
    admission_no: string;
    full_name_bn: string;
    full_name_en: string;
    full_name_ar: string | null;
    is_residential: boolean;
  }> = [];
  let attendanceToday: Array<{ student_id: string; status: string }> = [];
  let totalStudents = 0;

  if (currentYear?.id) {
    const [enrollmentResult, attendanceResult] = await Promise.all([
      supabase
        .from('student_enrollments')
        .select('student_id')
        .eq('tenant_id', context.tenantId)
        .eq('academic_year_id', currentYear.id)
        .eq('is_active', true),
      supabase
        .from('attendance_records')
        .select('student_id, status')
        .eq('tenant_id', context.tenantId)
        .eq('academic_year_id', currentYear.id)
        .eq('attendance_date', today),
    ]);

    const enrolledIds = [...new Set((enrollmentResult.data || []).map((item) => item.student_id))];
    totalStudents = enrolledIds.length;
    attendanceToday = attendanceResult.data || [];

    if (enrolledIds.length) {
      const { data } = await supabase
        .from('students')
        .select('id, admission_no, full_name_bn, full_name_en, full_name_ar, is_residential')
        .eq('tenant_id', context.tenantId)
        .eq('is_active', true)
        .in('id', enrolledIds)
        .order('full_name_bn', { ascending: true })
        .limit(300);
      students = data || [];
    }
  }

  const attendanceByStudent = new Map(attendanceToday.map((record) => [record.student_id, record.status]));
  const presentStudentIds = new Set(attendanceToday.filter((record) => record.status === 'present').map((record) => record.student_id));
  const roleLabels: Record<string, Record<string, string>> = {
    madrasa_admin: { bn: 'মুহতামিম / প্রিন্সিপাল', en: 'Madrasa Admin / Principal', ar: 'مدير المدرسة' },
    academic_dean: { bn: "নাজেমে তা'লীমাত", en: 'Academic Dean', ar: 'الناظر الأكاديمي' },
    teacher: { bn: 'শিক্ষক / উস্তাদ', en: 'Teacher / Ustadh', ar: 'المعلم' },
    accountant: { bn: 'হিসাবরক্ষক', en: 'Accountant', ar: 'المحاسب' },
    hostel_warden: { bn: 'হোস্টেল তত্ত্বাবধায়ক', en: 'Hostel Warden', ar: 'مشرف السكن' },
  };
  const roleLabel = roleLabels[context.role]?.[locale] || context.role;
  const statusLabels: Record<string, Record<string, string>> = {
    absent: { bn: 'অনুপস্থিত', en: 'Absent', ar: 'غائب' },
    late: { bn: 'বিলম্বে', en: 'Late', ar: 'متأخر' },
    excused: { bn: 'ছুটি মঞ্জুর', en: 'Excused', ar: 'بعذر' },
  };

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{copy.title}</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{copy.badge}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · {copy.teacherLabel}: <strong>{context.fullName}</strong> · {copy.roleLabel}: {roleLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/attendance"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Calendar className="h-4 w-4" />
            {dict.nav.attendance}
          </Link>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
            <Calendar className="h-4 w-4 text-emerald-700" />
            <span>{copy.todayDate}: <strong>{new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-GB' : 'bn-BD', { timeZone: 'Asia/Dhaka' })}</strong></span>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Users className="h-4 w-4 text-emerald-700" />
              {copy.attendanceTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{copy.attendanceSubtitle}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            {copy.presentToday}: <span className="font-mono text-emerald-700">{presentStudentIds.size} / {totalStudents}</span> {copy.studentsSuffix}
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">{copy.noStudents}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm rtl:text-right">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">{copy.admissionNo}</th>
                  <th className="px-5 py-3">{copy.studentName}</th>
                  <th className="px-5 py-3">{copy.boarding}</th>
                  <th className="px-5 py-3">{copy.todayStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const status = attendanceByStudent.get(student.id);
                  const name = locale === 'ar'
                    ? student.full_name_ar || student.full_name_en || student.full_name_bn
                    : locale === 'en'
                      ? student.full_name_en || student.full_name_bn
                      : student.full_name_bn;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-slate-800">{student.admission_no}</td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{name}</div>
                        {locale === 'bn' && student.full_name_en && <div className="text-xs text-slate-400">{student.full_name_en}</div>}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {student.is_residential ? <span className="font-medium text-blue-700">{copy.residential}</span> : <span className="text-slate-500">{copy.nonResidential}</span>}
                      </td>
                      <td className="px-5 py-3">
                        {status === 'present' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            <CheckCircle className="h-3 w-3" />{copy.present}
                          </span>
                        ) : status ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            <Clock className="h-3 w-3" />{statusLabels[status]?.[locale] || copy.pending}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            <Clock className="h-3 w-3" />{copy.pending}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
