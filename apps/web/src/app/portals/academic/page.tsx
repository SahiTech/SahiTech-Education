import React from 'react';
import { requirePermission } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { QAWMI_MARHALAS } from '@sahitech/domain';
import { BookMarked, Calendar, Layers, BookOpen, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NazimeTaleematPortalPage() {
  // Enforce Academic Dean authority
  const context = await requirePermission('manage_curriculum');
  const supabase = await createClient();

  const [departmentsRes, classesRes, academicYearRes] = await Promise.all([
    supabase
      .from('departments')
      .select('*')
      .eq('tenant_id', context.tenantId),
    supabase
      .from('classes')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('level_order', { ascending: true }),
    supabase
      .from('academic_years')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .eq('is_current', true)
      .maybeSingle(),
  ]);

  const departments = departmentsRes.data || [];
  const classes = classesRes.data || [];
  const currentYear = academicYearRes.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              নাজেমে তা&apos;লীমাত একাডেমিক পোর্টাল
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              শিক্ষা ও পাঠ্যসূচি প্রশাসন
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · মারহালা স্তরবিন্যাস, কিতাব বণ্টন, ছালা / সেমিস্টার পরীক্ষা ও সনদ প্রশাসন।
          </p>
        </div>
      </div>

      {/* Active Academic Year Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-emerald-700" />
          চলতি শিক্ষাবর্ষ ও টার্ম ক্যালেন্ডার
        </h2>
        {currentYear ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium">শিক্ষাবর্ষের নাম</span>
              <span className="font-bold text-slate-900">{currentYear.name_bn}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">হিজরি সন</span>
              <span className="font-semibold text-slate-900">{currentYear.hijri_year || '১৪৪৭-১৪৪৮'} হিজরি</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">শুরু তারিখ</span>
              <span className="font-mono text-slate-700">{currentYear.start_date}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">সমাপ্তি তারিখ</span>
              <span className="font-mono text-slate-700">{currentYear.end_date}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-amber-700">কোনো চলতি শিক্ষাবর্ষ নির্ধারিত নেই।</p>
        )}
      </div>

      {/* Departments & Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-purple-600" />
            বিভাগসমূহ
          </h3>
          <div className="divide-y divide-slate-100">
            {departments.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">কোনো বিভাগ যুক্ত নেই।</p>
            ) : (
              departments.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{d.name_bn}</div>
                    <div className="text-xs text-slate-400">{d.name_en}</div>
                  </div>
                  <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {d.code}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <BookMarked className="h-5 w-5 text-emerald-700" />
            অনুমোদিত জামাত ও মারহালা তালিকা
          </h3>
          <div className="divide-y divide-slate-100">
            {classes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">কোনো জামাত যুক্ত নেই।</p>
            ) : (
              classes.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{c.name_bn}</div>
                    <div className="text-xs text-slate-400">{c.name_en}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">স্তর ক্রম: {c.level_order}</span>
                    <span className="font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Canonical Kitabs Overview from Qawmi Engine */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Award className="h-5 w-5 text-amber-600" />
          কওমি দরসে নেজামী অনুমোদিত প্রামাণ্য কিতাব মানচিত্র
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ ও আল-হাইআতুল উলয়া কর্তৃক নির্ধারিত প্রামাণ্য কিতাব নির্দেশিকা।
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QAWMI_MARHALAS.slice(0, 6).map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">{m.name.bn}</span>
                <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                  {m.code}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {m.canonicalKitabs.map((k, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                  >
                    <BookOpen className="h-2.5 w-2.5 mr-1 text-emerald-700" />
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
