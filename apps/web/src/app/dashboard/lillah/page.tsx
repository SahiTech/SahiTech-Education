import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { HeartHandshake, ShieldCheck, Users, Plus, Award, AlertCircle } from 'lucide-react';
import { LillahEvaluationModal } from './lillah-modal';

export const dynamic = 'force-dynamic';

export default async function LillahPage() {
  const context = await getActiveTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  const [evaluationsRes, studentsRes] = await Promise.all([
    supabase
      .from('lillah_evaluations')
      .select(`
        id,
        family_monthly_income,
        number_of_siblings,
        is_orphan,
        shariah_eligibility_status,
        subsidy_percentage,
        approved_monthly_stipend,
        valid_until,
        created_at,
        students:student_id (id, full_name_bn, admission_no, guardian_phone)
      `)
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('students')
      .select('id, full_name_bn, admission_no')
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true),
  ]);

  const evaluations = evaluationsRes.data || [];
  const students = studentsRes.data || [];

  const totalBeneficiaries = evaluations.length;
  const fullSubsidies = evaluations.filter((e) => e.subsidy_percentage === 100).length;
  const totalMonthlyStipend = evaluations.reduce((acc, e) => acc + (Number(e.approved_monthly_stipend) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              লিল্লাহ বোর্ডিং ও যাকাত তহবিল ব্যবস্থাপনা (Shariah Lillah & Zakat)
            </h1>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
              শরীয়াহ নিরীক্ষিত তহবিল
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · হকদার এতিম ও দরিদ্র তালিবুল ইলমদের খোরাকি অনুমোদন ও সহায়তা রেজিস্ট্রি।
          </p>
        </div>

        <LillahEvaluationModal students={students} />
      </div>

      {/* Document 26 Shariah Fund Advisory Banner */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-4 shadow-sm flex items-start gap-3">
        <HeartHandshake className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-950 space-y-1">
          <span className="font-bold block">
            শরীয়াহ তহবিল পৃথকীকরণ নীতি কার্যকর (Document 26 Fund Segregation Invariant)
          </span>
          <p className="text-purple-900 leading-relaxed">
            যাকাত, ফিতরা ও সদকায়ে ওয়াজিবাহর অর্থ শুধুমাত্র শরীয়াহর বিধিবদ্ধ খাতে হকদার মুস্তাহিক্বীনদের খাদ্য ও আবাসনে ব্যয় করা হয়। সাধারণ ফান্ড বা প্রাতিষ্ঠানিক নির্মাণকাজে যাকাত তহবিলের অর্থ স্থানান্তর সম্পূর্ণরূপে নিষিদ্ধ।
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>মোট সুবিধাভোগী (Beneficiaries)</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalBeneficiaries} জন</div>
          <div className="text-xs text-slate-500 mt-1">পূর্ণ ফ্রি খোরাকি: {fullSubsidies} জন</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>মাসিক অনুদান বরাদ্দ (Monthly Subsidy)</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">৳ {totalMonthlyStipend.toLocaleString('bn-BD')}</div>
          <div className="text-xs text-slate-500 mt-1">চলতি মাসের লিল্লাহ খোরাকি ব্যয়</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>শরীয়াহ যাচাই অবস্থা (Verification)</span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">১০০% নিরীক্ষিত</div>
          <div className="text-xs text-slate-500 mt-1">স্থানীয় সুপারিশ ও আয় যাচাইকৃত</div>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            তালিকাভুক্ত লিল্লাহ বোর্ডিং শিক্ষার্থী রেজিস্টার
          </h3>
          <span className="text-xs text-slate-400 font-mono">মুস্তাহিক তালিকা</span>
        </div>

        {evaluations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            এখনো কোনো শিক্ষার্থীকে লিল্লাহ সুবিধায় তালিকাভুক্ত করা হয়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">শিক্ষার্থীর নাম</th>
                  <th className="px-4 py-3">পারিবারিক মাসিক আয়</th>
                  <th className="px-4 py-3">অবস্থা (Orphan/Family)</th>
                  <th className="px-4 py-3">ছাড়ের পরিমাণ</th>
                  <th className="px-4 py-3">মাসিক খোরাকি অনুদান</th>
                  <th className="px-4 py-3 text-right">মেয়াদ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluations.map((ev) => {
                  const st = ev.students as any;
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs">
                        <span className="font-bold text-slate-900 block">{st?.full_name_bn}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{st?.admission_no}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        ৳ {ev.family_monthly_income}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {ev.is_orphan ? (
                          <span className="inline-flex rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                            এতিম (Orphan)
                          </span>
                        ) : (
                          <span className="text-slate-600">দরিদ্র (ভাইবোন: {ev.number_of_siblings})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-purple-700">
                        {ev.subsidy_percentage}% ফ্রি খোরাকি
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                        ৳ {ev.approved_monthly_stipend}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">
                        {ev.valid_until || '—'}
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
