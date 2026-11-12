import React from 'react';
import { QAWMI_MARHALAS } from '@sahitech/domain';
import { BookOpen, Layers, Award, CheckCircle2 } from 'lucide-react';

export default function AcademicEnginePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            একাডেমিক ইঞ্জিন ও পাঠ্যসূচি (Academic Curriculum Engine)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            কওমি দরসে নেজামী ও আলিয়া কারিকুলামের স্তরবিন্যাস, কিতাব বণ্টন এবং সনদ কাঠামো।
          </p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition">
            + নতুন কিতাব / বিষয় যোগ
          </button>
        </div>
      </div>

      {/* Engine Switcher / Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border-2 border-emerald-600 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">ডিফল্ট ইঞ্জিন</span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">সক্রিয়</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-2">কওমি দরসে নেজামী (Dars-e-Nizami)</h3>
          <p className="text-xs text-slate-600 mt-1">
            বেফাকুল মাদারিসিল আরাবিয়া ও আল-হাইআতুল উলয়া সমমান পাঠ্যক্রম। ইবতিদায়িয়্যাহ থেকে দাওরায়ে হাদীস ও ইফতা।
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm opacity-90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">বোর্ড ইঞ্জিন</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">প্রস্তুত</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-2">আলিয়া মাদ্রাসা বোর্ড (BMEB Framework)</h3>
          <p className="text-xs text-slate-600 mt-1">
            বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড অনুমোদিত ইবতেদায়ি, দাখিল, আলিম, ফাযিল ও কামিল স্তরের জিপিএ গ্রেডিং কাঠামো।
          </p>
        </div>
      </div>

      {/* Marhala List */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-700" />
            দরসে নেজামী মারহালা ও অনুমোদিত প্রামাণ্য কিতাবসমূহ
          </h2>
          <span className="text-xs text-slate-500 font-mono">মোট মারহালা: {QAWMI_MARHALAS.length}টি</span>
        </div>

        <div className="divide-y divide-slate-100">
          {QAWMI_MARHALAS.map((marhala) => (
            <div key={marhala.id} className="p-5 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700">
                    {marhala.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {marhala.name.bn}
                  </h3>
                  <span className="text-xs text-slate-400 font-normal">
                    ({marhala.name.en})
                  </span>
                  {marhala.name.ar && (
                    <span className="text-xs text-emerald-800 font-serif mr-2" dir="rtl">
                      {marhala.name.ar}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 max-w-2xl">
                  {marhala.description.bn}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 md:justify-end max-w-md">
                {marhala.canonicalKitabs.map((kitab, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 border border-amber-200/60"
                  >
                    <BookOpen className="h-3 w-3 mr-1 text-amber-700" />
                    {kitab}
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

