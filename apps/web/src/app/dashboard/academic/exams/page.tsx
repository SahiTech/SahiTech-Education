import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { ExamManagementViews } from './exam-management-views';
import { Award, Layers } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ExamsPage() {
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        পরীক্ষা ব্যবস্থাপনা দেখার জন্য অনুগ্রহ করে প্রথমে লগইন করুন।
      </div>
    );
  }

  const supabase = await createClient();

  const [examsRes, studentsRes, subjectsRes] = await Promise.all([
    supabase
      .from('exams')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('start_date', { ascending: false }),
    supabase
      .from('students')
      .select('id, full_name_bn, admission_no')
      .eq('tenant_id', context.tenantId)
      .order('full_name_bn', { ascending: true })
      .limit(100),
    supabase
      .from('subjects')
      .select('id, name_bn, code')
      .eq('tenant_id', context.tenantId)
      .order('name_bn', { ascending: true }),
  ]);

  const exams = examsRes.data || [];
  const students = studentsRes.data || [];
  const subjects = subjectsRes.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              ইমতিহান ও পরীক্ষা ব্যবস্থাপনা (Examinations & Marks)
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              একাডেমিক মূল্যায়ন
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · সাময়িক ও বার্ষিক ছালা ইমতিহান, কিতাবভিত্তিক নম্বর এন্ট্রি ও প্রামাণ্য ফল প্রকাশ।
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/academic/sanad"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <Award className="h-4 w-4 text-emerald-700" />
            ডিজিটাল সনদ ব্যবস্থাপনা
          </Link>
        </div>
      </div>

      <ExamManagementViews students={students} subjects={subjects} exams={exams} />
    </div>
  );
}
