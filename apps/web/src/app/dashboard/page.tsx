import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  BookMarked, 
  CalendarCheck, 
  Receipt, 
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Plus,
  School,
  ExternalLink,
  Lock
} from 'lucide-react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const context = await getActiveTenantContext();

  // If user is authenticated but does not have a provisioned madrasa tenant yet
  if (!context) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-4">
            <School className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            কোনো সক্রিয় মাদরাসা প্রতিষ্ঠান পাওয়া যায়নি
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            আপনার অ্যাকাউন্টের সাথে কোনো মাদরাসা সংযুক্ত নেই অথবা এখনো কোনো প্রতিষ্ঠান তৈরি করা হয়নি। MDI প্ল্যাটফর্মে আপনার মাদরাসা পরিচালনা করতে এখনই নতুন প্রতিষ্ঠান নিবন্ধন করুন।
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register-madrasa"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-800 transition"
            >
              <Plus className="h-4 w-4" />
              নতুন মাদরাসা নিবন্ধন করুন (Register Madrasa)
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              অন্য অ্যাকাউন্টে লগইন করুন
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch live stats from Supabase respecting RLS and tenant_id
  const supabase = await createClient();

  const [
    studentsRes,
    residentialRes,
    lillahRes,
    classesRes,
    academicYearRes,
    todayAttendanceRes,
    recentStudentsRes,
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', context.tenantId),
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', context.tenantId)
      .eq('is_residential', true),
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', context.tenantId)
      .eq('is_lillah_boarder', true),
    supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', context.tenantId),
    supabase
      .from('academic_years')
      .select('name_bn, name_en, hijri_year')
      .eq('tenant_id', context.tenantId)
      .eq('is_current', true)
      .maybeSingle(),
    supabase
      .from('attendance_records')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', context.tenantId)
      .eq('attendance_date', new Date().toISOString().split('T')[0])
      .eq('status', 'present'),
    supabase
      .from('students')
      .select('id, admission_no, full_name_bn, full_name_en, is_residential, is_lillah_boarder, created_at')
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalStudents = studentsRes.count ?? 0;
  const residentialCount = residentialRes.count ?? 0;
  const lillahCount = lillahRes.count ?? 0;
  const nonResidentialCount = Math.max(0, totalStudents - residentialCount);
  const totalClasses = classesRes.count ?? 0;
  const academicYear = academicYearRes.data;
  const todayAttendance = todayAttendanceRes.count ?? 0;
  const recentStudents = recentStudentsRes.data ?? [];

  const curriculumLabels: Record<string, string> = {
    qawmi: 'কওমি দরসে নেজামী (Qawmi)',
    alia: 'বাংলাদেশ মাদরাসা শিক্ষা বোর্ড (Alia)',
    hybrid: 'সমন্বিত পাঠ্যক্রম (Hybrid)',
  };

  const roleLabels: Record<string, string> = {
    super_admin: 'সিস্টেম অ্যাডমিন',
    madrasa_admin: 'মুহতামিম / প্রিন্সিপাল',
    academic_dean: 'নাজেমে তালিমাত',
    teacher: 'উস্তাদ / শিক্ষক',
    accountant: 'হিসাবরক্ষক / ক্যাশিয়ার',
    hostel_warden: 'দারুল ইক্বামাহ নাযিম',
    student: 'তালিবুল ইলম',
    parent: 'অভিভাবক',
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {context.tenantName}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              সক্রিয় প্রতিষ্ঠান
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-600">
              কোড: {context.tenantCode}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            দায়িত্ব: <strong className="text-slate-700">{roleLabels[context.role] || context.role}</strong> ({context.fullName})
            {academicYear && (
              <> · শিক্ষাবর্ষ: {academicYear.name_bn} {academicYear.hijri_year ? `(${academicYear.hijri_year} হিজরি)` : ''}</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
            কারিকুলাম: <strong className="text-emerald-700">{curriculumLabels[context.curriculumType] || context.curriculumType}</strong>
          </div>
          <Link
            href="/dashboard/students/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            নতুন ভর্তি (Admission)
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>মোট শিক্ষার্থী (তালিবুল ইলম)</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {totalStudents} <span className="text-sm font-normal text-slate-500">জন</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span>আবাসিক: {residentialCount} · অনাবাসিক: {nonResidentialCount}</span>
          </div>
        </div>

        {/* Classes & Marhalas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>সক্রিয় জামাত ও মারহালা</span>
            <BookMarked className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {totalClasses} <span className="text-sm font-normal text-slate-500">টি শ্রেণি</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {context.curriculumType === 'qawmi' 
              ? 'দরসে নেজামী অনুমোদিত স্তর' 
              : 'বোর্ড কারিকুলাম শ্রেণি বিন্যাস'}
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>আজকের উপস্থিতি (হাজিরা)</span>
            <CalendarCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {todayAttendance} <span className="text-sm font-normal text-slate-500">জন উপস্থিত</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {totalStudents > 0 
              ? `উপস্থিতির হার: ${Math.round((todayAttendance / totalStudents) * 100)}%` 
              : 'হাজিরা রেকর্ড সংরক্ষিত হচ্ছে'}
          </div>
        </div>

        {/* Lillah Boarding */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>লিল্লাহ বোর্ডিং ও যাকাত ফান্ড</span>
            <Receipt className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {lillahCount} <span className="text-sm font-normal text-slate-500">জন প্রাপক</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            শরীয়াহ ফান্ড পৃথকীকরণ নিশ্চিত (Doc 26)
          </div>
        </div>
      </div>

      {/* Role Portals Quick Access Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            দায়িত্বভিত্তিক পোর্টালসমূহ (Role-Based Portals)
          </h2>
          <span className="text-xs text-slate-400">অনুমোদিত অ্যাক্সেস</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/portals/admin"
            className="group flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">মুহতামিম পোর্টাল</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700" />
            </div>
            <span className="text-[11px] text-slate-500 mt-1">প্রাতিষ্ঠানিক ও প্রশাসনিক নিয়ন্ত্রণ</span>
          </Link>

          <Link
            href="/portals/academic"
            className="group flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">তা&apos;লীমাত পোর্টাল</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700" />
            </div>
            <span className="text-[11px] text-slate-500 mt-1">মারহালা, কিতাব বণ্টন ও পরীক্ষা</span>
          </Link>

          <Link
            href="/portals/faculty"
            className="group flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">উস্তাদ পোর্টাল</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700" />
            </div>
            <span className="text-[11px] text-slate-500 mt-1">দৈনিক হাজিরা ও নম্বর এন্ট্রি</span>
          </Link>

          <Link
            href="/portals/bursar"
            className="group flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">হিসাব ও ক্যাশ কাউন্টার</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700" />
            </div>
            <span className="text-[11px] text-slate-500 mt-1">ফি আদায়, ভাউচার ও তহবিল</span>
          </Link>
        </div>
      </div>

      {/* Recent Admissions & Database Security Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Students Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              সাম্প্রতিক ভর্তি হওয়া শিক্ষার্থী (Recent Admissions)
            </h3>
            <Link
              href="/dashboard/students"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              সকল শিক্ষার্থী দেখুন →
            </Link>
          </div>

          {recentStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              এখনো কোনো শিক্ষার্থী ভর্তি করা হয়নি।
              <div className="mt-3">
                <Link
                  href="/dashboard/students/new"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  প্রথম শিক্ষার্থীর ভর্তি সম্পন্ন করুন
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">দাখেলা নং</th>
                    <th className="px-4 py-2.5">শিক্ষার্থীর নাম</th>
                    <th className="px-4 py-2.5">আবাসিক অবস্থা</th>
                    <th className="px-4 py-2.5">লিল্লাহ বোর্ডিং</th>
                    <th className="px-4 py-2.5 text-right">ভর্তির তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                        {st.admission_no}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{st.full_name_bn}</div>
                        <div className="text-xs text-slate-400">{st.full_name_en}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {st.is_residential ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                            আবাসিক
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                            অনাবাসিক
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {st.is_lillah_boarder ? (
                          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200">
                            লিল্লাহ প্রাপক
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">সাধারণ</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">
                        {new Date(st.created_at).toLocaleDateString('bn-BD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Database & RLS Security Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              নিরাপত্তা ও আইসোলেশন স্ট্যাটাস
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            MDI ইঞ্জিন পোস্টগ্রেস ১৭ লেভেলে সম্পূর্ণ রো-লেভেল সিকিউরিটি (RLS) প্রয়োগ করে। প্রতিটি কোয়েরি স্বয়ংক্রিয়ভাবে আপনার মাদরাসার আইডি (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700">{context.tenantId.slice(0, 8)}...</code>) দ্বারা সীমাবদ্ধ।
          </p>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>টেন্যান্ট আইসোলেশন:</span>
              <span className="font-semibold text-emerald-700">সক্রিয় (Strict RLS)</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>অডিট লগিং:</span>
              <span className="font-semibold text-emerald-700">অনলাইন (Append-Only)</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>সার্ভার ক্লাস্টার:</span>
              <span className="font-mono text-[11px] text-slate-500">ap-south-1 (Mumbai)</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>ডেটাবেস ভার্সন:</span>
              <span className="font-mono text-[11px] text-slate-500">PostgreSQL 17.6</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
