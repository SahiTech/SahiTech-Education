import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { getExecutiveOverviewReport, getBefaqBoardReturn } from '@/app/actions/reports';
import {
  BarChart3,
  Users,
  GraduationCap,
  Home,
  HeartHandshake,
  Receipt,
  Printer,
  Building2,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        {dict.reports.subtitle}
      </div>
    );
  }

  const [overview, befaqReturn] = await Promise.all([
    getExecutiveOverviewReport().catch(() => ({
      totalStudents: 0,
      totalTeachers: 0,
      residentialStudents: 0,
      lillahBoarders: 0,
      totalInvoiced: 0,
      totalCollected: 0,
      totalReceivable: 0,
      accountsCount: 0,
    })),
    getBefaqBoardReturn().catch(() => ({
      tenant: null,
      classes: [],
      students: [],
      generatedAt: new Date().toISOString(),
    })),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {dict.reports.title}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {dict.nav.adminPortal}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · {dict.reports.subtitle}
          </p>
        </div>
      </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>{dict.dashboard.totalStudents}</span>
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
                <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                  {overview.totalStudents}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {dict.dashboard.residential}: {overview.residentialStudents}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>{dict.teachers.title}</span>
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                  </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                      {overview.totalTeachers}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{dict.common.active}</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                        <span>{dict.dashboard.lillahBoarders}</span>
                        <HeartHandshake className="h-4 w-4 text-purple-600" />
                      </div>
                        <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                          {overview.lillahBoarders}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{dict.dashboard.zakatWelfare}</div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                            <span>{dict.reports.totalCollected}</span>
                            <Receipt className="h-4 w-4 text-amber-600" />
                          </div>
                            <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                              ৳ {overview.totalCollected.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {dict.reports.totalReceivable}: ৳ {overview.totalReceivable.toLocaleString()}
                            </div>
                          </div>
                        </div>

                              {/* Board Return & Executive Summary */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Befaq Board Return Card */}
                                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-emerald-700" />
                                    <h2 className="text-base font-bold text-slate-900">
                                      {dict.reports.befaqReturnTitle}
                                    </h2>
                                  </div>

                                  <p className="text-xs text-slate-500 leading-relaxed">
                                    {dict.reports.befaqReturnSubtitle}
                                  </p>

                                    <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                                      <div className="flex items-center justify-between text-slate-600">
                                        <span>{dict.reports.totalEnrolled}:</span>
                                        <span className="font-bold font-mono text-slate-900">{befaqReturn.students?.length || 0}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-slate-600">
                                        <span>{dict.reports.residentialEnrolled}:</span>
                                        <span className="font-bold font-mono text-slate-900">
                                          {befaqReturn.students?.filter((s: any) => s.is_residential).length || 0}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-slate-600">
                                        <span>{dict.reports.lillahEnrolled}:</span>
                                        <span className="font-bold font-mono text-slate-900">
                                          {befaqReturn.students?.filter((s: any) => s.is_lillah_boarder).length || 0}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                        {/* Financial Health Summary */}
                                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                                          <div className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-emerald-700" />
                                            <h2 className="text-base font-bold text-slate-900">
                                              {dict.reports.financialSummary}
                                            </h2>
                                          </div>

                                          <p className="text-xs text-slate-500 leading-relaxed">
                                            {dict.finance.shariahSegregated}
                                          </p>

                                          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                                            <div className="flex items-center justify-between text-slate-600">
                                              <span>{dict.reports.totalInvoiced}:</span>
                                              <span className="font-bold font-mono text-slate-900">৳ {overview.totalInvoiced.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-600">
                                              <span>{dict.reports.totalCollected}:</span>
                                              <span className="font-bold font-mono text-emerald-700">৳ {overview.totalCollected.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-600">
                                              <span>{dict.reports.totalReceivable}:</span>
                                              <span className="font-bold font-mono text-amber-700">৳ {overview.totalReceivable.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        </div>
                                    </div>
                                  </div>
                                  );
}
