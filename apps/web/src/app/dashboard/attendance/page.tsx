import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { AttendanceView } from './attendance-view';
import { CalendarCheck } from 'lucide-react';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        {dict.attendance.subtitle}
      </div>
    );
  }

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const [studentsRes, sectionsRes, recordsRes] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name_bn, admission_no')
      .eq('tenant_id', context.tenantId)
      .order('full_name_bn', { ascending: true })
      .limit(100),
    supabase
      .from('sections')
      .select(`
        id,
        name_bn,
        classes:class_id (name_bn)
      `)
      .eq('tenant_id', context.tenantId),
    supabase
      .from('attendance_records')
      .select('student_id, status, remark')
      .eq('tenant_id', context.tenantId)
      .eq('attendance_date', today),
  ]);

  const students = studentsRes.data || [];
  const sections = (sectionsRes.data as any) || [];
  const initialRecords = recordsRes.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {dict.attendance.title}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {dict.common.active}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · {dict.attendance.subtitle}
          </p>
        </div>
      </div>

      <AttendanceView students={students} sections={sections} initialRecords={initialRecords} />
    </div>
  );
}
