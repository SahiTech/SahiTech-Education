import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { SanadManagementViews } from './sanad-management-views';
import { Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function SanadPage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        {dict.sanad.subtitle}
      </div>
    );
  }

  const supabase = await createClient();

  const [sanadsRes, studentsRes, classesRes, academicYearsRes] = await Promise.all([
    supabase
      .from('sanads')
      .select(`
        id,
        sanad_serial_no,
        title_bn,
        title_en,
        title_ar,
        marhala_name_ar,
        result_dharja,
        gpa,
        issue_date,
        verification_hash,
        status,
        students:student_id (full_name_bn, admission_no),
        classes:class_id (name_bn)
      `)
      .eq('tenant_id', context.tenantId)
      .order('issue_date', { ascending: false }),
    supabase
      .from('students')
      .select('id, full_name_bn, admission_no')
      .eq('tenant_id', context.tenantId)
      .order('full_name_bn', { ascending: true })
      .limit(100),
    supabase
      .from('classes')
      .select('id, name_bn')
      .eq('tenant_id', context.tenantId)
      .order('level_order', { ascending: true }),
    supabase
      .from('academic_years')
      .select('id, name_bn')
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false }),
  ]);

  const sanads = sanadsRes.data || [];
  const students = studentsRes.data || [];
  const classes = classesRes.data || [];
  const academicYears = academicYearsRes.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {dict.sanad.title}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {dict.sanad.tamperProof}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · {dict.sanad.subtitle}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/academic"
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 min-h-[40px]"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{dict.common.back}</span>
          </Link>
        </div>
      </div>

      <SanadManagementViews
        students={students}
        classes={classes}
        academicYears={academicYears}
        sanads={sanads}
      />
    </div>
  );
}
