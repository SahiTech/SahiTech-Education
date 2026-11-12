import React from 'react';
import { 
  Users, 
  BookMarked, 
  CalendarCheck, 
  Receipt, 
  ArrowUpRight,
  ShieldCheck,
  Building
} from 'lucide-react';

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              মাদরাসা প্রশাসনিক ড্যাশবোর্ড
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              সক্রিয় প্রতিষ্ঠান
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            দারুল উলুম মাদরাসা (কোড: DU-001) · শিক্ষাবর্ষ: ১৪৪৭-১৪৪৮ হিজরি / ২০২৬-২০২৭
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
            কারিকুলাম: <strong className="text-emerald-700">কওমি দরসে নেজামী</strong>
          </div>
          <button className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition">
            + নতুন শিক্ষার্থী ভর্তি
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>মোট শিক্ষার্থী (তালিবুল ইলম)</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">৪৫০ জন</div>
          <div className="mt-1 flex items-center text-xs text-emerald-600">
            <ArrowUpRight className="h-3 w-3 mr-0.5" />
            <span>আবাসিক: ৩২০ জন · অনাবাসিক: ১৩০ জন</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>সক্রিয় জামাত ও মারহালা</span>
            <BookMarked className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">৯ টি মারহালা</div>
          <div className="mt-1 text-xs text-slate-500">
            দাওরায়ে হাদীস, মিশকাত ও হিফজ সহ
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>দৈনিক উপস্থিতি (আজকের হাজিরা)</span>
            <CalendarCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">৯৬.৪%</div>
          <div className="mt-1 text-xs text-slate-500">
            উপস্থিত: ৪৩৪ জন · অনুপস্থিত: ১৬ জন
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>লিল্লাহ বোর্ডিং ও মাহাদ ফান্ড</span>
            <Receipt className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">৳ ২,৮৫,০০০</div>
          <div className="mt-1 text-xs text-slate-500">
            চলতি মাসের সাদাকাহ ও খোরাকি আদায়
          </div>
        </div>
      </div>

      {/* Database Connection & Status banner */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <div>
            <div className="text-sm font-bold text-emerald-950">
              সুরক্ষিত পোস্টগ্রেস ১৭ ডেটাবেস ও টেন্যান্ট আইসোলেশন সক্রিয়
            </div>
            <div className="text-xs text-emerald-800">
              Supabase Project: sahitech-mdi (ap-south-1) · সর্বমোট ১৫টি টেবিল RLS নীতি দ্বারা সুরক্ষিত।
            </div>
          </div>
        </div>
        <div className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-emerald-200 text-emerald-800">
          Connected
        </div>
      </div>
    </div>
  );
}

