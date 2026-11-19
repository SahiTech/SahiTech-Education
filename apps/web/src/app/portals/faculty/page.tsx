import React from 'react';
import { requirePermission } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle, Clock, Calendar, Users } from 'lucide-react';
import { getServerDictionary, getServerLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function FacultyPortalPage() {
  // Enforce teacher / attendance authority
  const [context, dict, locale] = await Promise.all([
    requirePermission('record_attendance'),
    getServerDictionary(),
    getServerLocale(),
  ]);
  const copy = dict.portals.faculty;
  const dateLocale = locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-GB' : 'bn-BD';
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const [studentsRes, attendanceRes] = await Promise.all([
    supabase
      .from('students')
      .select('id, admission_no, full_name_bn, full_name_en, full_name_ar, is_residential')
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true)
      .limit(20),
    supabase
      .from('attendance_records')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .eq('attendance_date', today),
  ]);

  const students = studentsRes.data || [];
  const attendanceToday = attendanceRes.data || [];
  const presentStudentIds = new Set(
    attendanceToday.filter((a) => a.status === 'present').map((a) => a.student_id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {copy.title}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {copy.badge}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · {copy.teacherLabel}: <strong>{context.fullName}</strong> · {copy.roleLabel}: {context.role}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-sm text-xs text-slate-600">
          <Calendar className="h-4 w-4 text-emerald-700" />
          <span>{copy.todayDate}: <strong>{new Date().toLocaleDateString(dateLocale)}</strong> ({today})</span>
        </div>
      </div>

      {/* Attendance Register */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-700" />
              {copy.attendanceTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {copy.attendanceSubtitle}
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
            {copy.presentToday}: {presentStudentIds.size} / {students.length} {copy.studentsSuffix}
          </span>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {copy.noStudents}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">{copy.admissionNo}</th>
                  <th className="px-5 py-3">{copy.studentName}</th>
                  <th className="px-5 py-3">{copy.boarding}</th>
                  <th className="px-5 py-3">{copy.todayStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const isPresent = presentStudentIds.has(st.id);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-slate-800">
                        {st.admission_no}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{locale === 'ar' ? (st.full_name_ar || st.full_name_en || st.full_name_bn) : locale === 'en' ? (st.full_name_en || st.full_name_bn) : st.full_name_bn}</div>
                        {locale === 'bn' && st.full_name_en && <div className="text-xs text-slate-400">{st.full_name_en}</div>}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {st.is_residential ? (
                          <span className="text-blue-700 font-medium">{copy.residential}</span>
                        ) : (
                          <span className="text-slate-500">{copy.nonResidential}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            {copy.present}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {copy.pending}
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
      </div>
    </div>
  );
}

