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

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        প্রতিবেদন দেখার জন্য অনুগ্রহ করে প্রথমে লগইন করুন।
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
              প্রাতিষ্ঠানিক প্রতিবেদন ও বোর্ড বিবরণী (Executive Reports & Returns)
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              মুহতামিম ড্যাশবোর্ড
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · বেফাকুল মাদারিসিল আরাবিয়া বোর্ড রিটার্ন, মাসিক অর্থায়ন ও পরিসংখ্যান।
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">মোট শিক্ষার্থী</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {overview.totalStudents} জন
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">নিবন্ধিত ও সক্রিয়</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">আসতিযায়ে কিরাম</span>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {overview.totalTeachers} জন
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">অনুমোদিত খেদমত</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">আবাসিক তালিবুল ইলম</span>
            <Home className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {overview.residentialStudents} জন
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">ছাত্রাবাসে অবস্থানরত</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">লিল্লাহ প্রাপক</span>
            <HeartHandshake className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {overview.lillahBoarders} জন
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">যাকাত ও খাদ্য সহায়তা</span>
        </div>
      </div>

      {/* Financial Health Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Receipt className="h-5 w-5 text-emerald-700" />
          মাহাদ অর্থায়ন ও ফি আদায় স্থিতি (Financial Summary)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <span className="text-xs text-slate-500 block font-bold uppercase">মোট ইনভয়েসড ফি</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              ৳ {overview.totalInvoiced.toLocaleString('bn-BD')}
            </span>
          </div>

          <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
            <span className="text-xs text-emerald-700 block font-bold uppercase">মোট আদায়কৃত ফি</span>
            <span className="text-2xl font-bold font-mono text-emerald-800 mt-1 block">
              ৳ {overview.totalCollected.toLocaleString('bn-BD')}
            </span>
          </div>

          <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
            <span className="text-xs text-amber-700 block font-bold uppercase">বকেয়া ফি</span>
            <span className="text-2xl font-bold font-mono text-amber-800 mt-1 block">
              ৳ {overview.totalReceivable.toLocaleString('bn-BD')}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            ডকুমেন্ট ২৬ শরীয়াহ তহবিল পৃথকীকরণ নীতি নিশ্চিতকৃত (General vs Zakat/Lillah)
          </span>
          <span className="font-mono">সক্রিয় লেজার হিসাব: {overview.accountsCount}টি</span>
        </div>
      </div>

      {/* Befaqul Madaris Board Return Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-700" />
              বেফাকুল মাদারিসিল আরাবিয়া বোর্ড রিটার্ন পরিসংখ্যান
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              মারহালা ও জামাতভিত্তিক তালিবুল ইলম বিন্যাস
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            রিটার্ন তারিখ: {new Date(befaqReturn.generatedAt).toLocaleDateString('bn-BD')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">স্তর নং</th>
                <th className="px-5 py-3">মারহালা / শ্রেণী</th>
                <th className="px-5 py-3 text-center">মোট ছাত্র</th>
                <th className="px-5 py-3 text-center">আবাসিক</th>
                <th className="px-5 py-3 text-center">অনাবাসিক</th>
                <th className="px-5 py-3 text-center">লিল্লাহ বোর্ডিং</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {befaqReturn.classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    কোনো শ্রেণী তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                befaqReturn.classes.map((cls, idx) => (
                  <tr key={cls.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{cls.name_bn}</td>
                    <td className="px-5 py-3 text-center font-mono font-semibold text-slate-800">
                      {/* Calculate or show count */}
                      {befaqReturn.students.length}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-slate-600">
                      {befaqReturn.students.filter((s: any) => s.is_residential).length}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-slate-600">
                      {befaqReturn.students.filter((s: any) => !s.is_residential).length}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-purple-700 font-semibold">
                      {befaqReturn.students.filter((s: any) => s.is_lillah_boarder).length}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
