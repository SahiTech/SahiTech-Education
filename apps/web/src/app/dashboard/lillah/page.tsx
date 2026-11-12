import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { HeartHandshake, ShieldCheck, Users, Plus, Award, AlertCircle } from 'lucide-react';
import { LillahEvaluationModal } from './lillah-modal';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function LillahPage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
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
              {dict.lillah.title}
            </h1>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
              {dict.finance.shariahSegregated}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · {dict.lillah.subtitle}
          </p>
        </div>

        <LillahEvaluationModal students={students} />
      </div>

      {/* Document 26 Shariah Fund Advisory Banner */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-5 shadow-sm flex items-start gap-3">
          <HeartHandshake className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-950 space-y-1">
            <span className="font-bold block">
              {dict.finance.shariahSegregated}
            </span>
            <p className="text-purple-900 leading-relaxed">
              {dict.lillah.shariahAdvisory}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{dict.lillah.mustahiqZakat}</span>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{totalBeneficiaries}</div>
            <div className="text-xs text-slate-400 mt-1">{dict.common.active}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{dict.lillah.subsidyPercentage} (100%)</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{fullSubsidies}</div>
            <div className="text-xs text-slate-400 mt-1">
              {totalBeneficiaries > 0 ? `${Math.round((fullSubsidies / totalBeneficiaries) * 100)}%` : '0%'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{dict.lillah.approvedStipend}</span>
              <ShieldCheck className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
              ৳ {totalMonthlyStipend.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">{dict.finance.zakatFund}</div>
          </div>
        </div>

        {/* Evaluations Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-purple-700" />
                  <span>{dict.lillah.eligibilityTitle}</span>
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {dict.common.total}: {evaluations.length}
                </span>
              </div>

              {evaluations.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    {dict.students.noStudentsDesc}
                  </div>
                  ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left rtl:text-right text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">{dict.common.name}</th>
                            <th className="px-4 py-3">{dict.lillah.familyIncome}</th>
                            <th className="px-4 py-3">{dict.lillah.orphanStudent}</th>
                            <th className="px-4 py-3">{dict.lillah.subsidyPercentage}</th>
                            <th className="px-4 py-3">{dict.lillah.approvedStipend}</th>
                            <th className="px-4 py-3">{dict.common.status}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {evaluations.map((ev: any) => (
                            <tr key={ev.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-4 py-3.5 text-xs">
                                <div className="font-bold text-slate-900">{ev.students?.full_name_bn}</div>
                                <div className="font-mono text-[10px] text-slate-400">{ev.students?.admission_no}</div>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                                {ev.family_monthly_income ? `৳ ${Number(ev.family_monthly_income).toLocaleString()}` : '—'}
                              </td>
                              <td className="px-4 py-3.5 text-xs">
                                {ev.is_orphan ? (
                                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                                    {dict.lillah.orphanStudent}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs font-bold text-purple-700">
                                {ev.subsidy_percentage}%
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900">
                                ৳ {Number(ev.approved_monthly_stipend || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 text-xs">
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                  {dict.common.approved}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
        )}
                </div>
    </div>
            );
}
