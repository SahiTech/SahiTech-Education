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
  Sparkles,
  ArrowRight,
  UserCheck,
  Home,
  HeartHandshake
} from 'lucide-react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
  const context = await getActiveTenantContext();

  const roleLabels: Record<string, Record<string, string>> = {
    bn: {
      super_admin: 'সিস্টেম অ্যাডমিন',
      madrasa_admin: 'মুহতামিম / প্রিন্সিপাল',
      academic_dean: "নাজেমে তা'লীমাত",
      teacher: 'উস্তাদ / শিক্ষক',
      accountant: 'হিসাবরক্ষক / ক্যাশিয়ার',
      hostel_warden: 'দারুল ইক্বামাহ নাযিম',
      student: 'তালিবুল ইলম',
      parent: 'অভিভাবক',
    },
    en: {
      super_admin: 'System Admin',
      madrasa_admin: 'Muhtamim / Principal',
      academic_dean: 'Academic Dean',
      teacher: 'Faculty / Ustadh',
      accountant: 'Bursar / Cashier',
      hostel_warden: 'Hostel Warden',
      student: 'Student',
      parent: 'Parent / Guardian',
    },
    ar: {
      super_admin: 'مسؤول النظام',
      madrasa_admin: 'المهتمم / المدير',
      academic_dean: 'ناظم التعليمات',
      teacher: 'الأستاذ / المعلم',
      accountant: 'أمين الصندوق / المحاسب',
      hostel_warden: 'ناظم دار الإقامة',
      student: 'طالب العلم',
      parent: 'ولي الأمر',
    },
  };

  const curriculumLabels: Record<string, Record<string, string>> = {
    bn: {
      qawmi: 'কওমি দরসে নেজামী',
      alia: 'বাংলাদেশ মাদরাসা শিক্ষা বোর্ড',
      hybrid: 'সমন্বিত পাঠ্যক্রম',
    },
    en: {
      qawmi: 'Qawmi Dars-e-Nizami',
      alia: 'Bangladesh Madrasa Education Board',
      hybrid: 'Hybrid Curriculum',
    },
    ar: {
      qawmi: 'الدرس النظامي (القومي)',
      alia: 'مجلس تعليم المدارس (العالية)',
      hybrid: 'المنهج المدمج',
    },
  };

  // If user is authenticated but does not have a provisioned madrasa tenant yet
  if (!context) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-4">
            <School className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {locale === 'ar' ? 'لم يتم العثور على مؤسسة تعليمية نشطة' : locale === 'en' ? 'No Active Madrasa Found' : 'কোনো সক্রিয় মাদরাসা প্রতিষ্ঠান পাওয়া যায়নি'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            {locale === 'ar'
              ? 'حسابك غير مرتبط بأي مدرسة مسجلة حتى الآن. للبدء في إدارة مؤسستك عبر منصة MDI، يرجى تسجيل مدرستك الآن.'
              : locale === 'en'
                ? 'Your account is not linked to any registered institution yet. Register your madrasa to begin using MDI.'
                : 'আপনার অ্যাকাউন্টের সাথে কোনো মাদরাসা সংযুক্ত নেই অথবা এখনো কোনো প্রতিষ্ঠান তৈরি করা হয়নি। MDI প্ল্যাটফর্মে আপনার মাদরাসা পরিচালনা করতে এখনই নতুন প্রতিষ্ঠান নিবন্ধন করুন।'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register-madrasa"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-800 transition min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              <span>{dict.nav.registerMadrasa}</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition min-h-[44px]"
            >
              <span>{locale === 'ar' ? 'تسجيل الدخول بحساب آخر' : locale === 'en' ? 'Login with another account' : 'অন্য অ্যাকাউন্টে লগইন করুন'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch live stats from Supabase respecting RLS and tenant_id
  const supabase = await createClient();

  const [
    tenantRes,
    studentsRes,
    residentialRes,
    lillahRes,
    classesRes,
    academicYearRes,
    todayAttendanceRes,
    recentStudentsRes,
  ] = await Promise.all([
    supabase
      .from('tenants')
      .select('*')
      .eq('id', context.tenantId)
      .single(),
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
      .limit(6),
  ]);

  const tenant = tenantRes.data;
  const totalStudents = studentsRes.count ?? 0;
  const residentialCount = residentialRes.count ?? 0;
  const lillahCount = lillahRes.count ?? 0;
  const nonResidentialCount = Math.max(0, totalStudents - residentialCount);
  const totalClasses = classesRes.count ?? 0;
  const academicYear = academicYearRes.data;
  const todayAttendance = todayAttendanceRes.count ?? 0;
  const recentStudents = recentStudentsRes.data ?? [];

  const activeRoleLabel = roleLabels[locale]?.[context.role] || roleLabels.bn[context.role] || context.role;
  const activeCurriculumLabel = curriculumLabels[locale]?.[context.curriculumType] || curriculumLabels.bn[context.curriculumType] || context.curriculumType;

  return (
    <div className="space-y-6">
      {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {context.tenantName}
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                {dict.common.active}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-600">
                {dict.common.code}: {context.tenantCode}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <span>{activeRoleLabel}</span>
              <span className="mx-1.5">·</span>
              <strong className="text-slate-700">{context.fullName}</strong>
              {academicYear && (
              <>
                <span className="mx-1.5">·</span>
                <span>{locale === 'en' ? academicYear.name_en || academicYear.name_bn : academicYear.name_bn}</span>
                {academicYear.hijri_year && <span className="font-mono text-xs text-slate-400"> ({academicYear.hijri_year}H)</span>}
              </>
              )}
            </p>
          </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                  <strong className="text-emerald-700">{activeCurriculumLabel}</strong>
                </div>
                <Link
                  href="/dashboard/students/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition min-h-[40px]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{dict.admissions.newApplication}</span>
                </Link>
              </div>
            </div>

            {/* Onboarding Progress Alert Banner */}
            {(!tenant?.onboarding_completed_at || (tenant?.onboarding_step ?? 1) < 6) && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <span>{locale === 'ar' ? 'إعداد تهيئة المؤسسة قيد التنفيذ' : locale === 'en' ? 'Institutional Setup in Progress' : 'প্রতিষ্ঠান অনবোর্ডিং সেটআপ চলমান'}</span>
                        <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 font-mono">
                          {tenant?.onboarding_step || 1} / 6
                        </span>
                    </div>
                    <div className="text-xs text-emerald-800 mt-0.5">
                      {locale === 'ar'
                        ? 'يرجى إكمال معالج الإعداد لتحديد هيكل المناهج وهيئة التدريس والبيانات الأساسية.'
                        : locale === 'en'
                          ? 'Complete the onboarding wizard to finalize curriculum tiers, campus profile, and key designations.'
                          : 'আপনার মাদরাসার পাঠ্যক্রম, ক্যাম্পাস ও দায়িত্বশীলদের পূর্ণাঙ্গ রূপরেখা চূড়ান্ত করতে সেটআপ উইজার্ডটি সম্পন্ন করুন।'}
                    </div>
                  </div>
                </div>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-800 transition shrink-0 min-h-[40px]"
                >
                  <span>{locale === 'ar' ? 'متابعة معالج الإعداد' : locale === 'en' ? 'Open Setup Wizard' : 'সেটআপ উইজার্ডে প্রবেশ করুন'}</span>
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Students */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>{dict.dashboard.totalStudents}</span>
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                  <div className="mt-2 text-3xl font-black text-slate-900 font-mono">
                    {totalStudents}
                  </div>
                    <div className="mt-2 flex items-center text-xs text-slate-500 gap-1.5">
                      <span>{dict.dashboard.residential}: {residentialCount}</span>
                      <span>·</span>
                      <span>{dict.dashboard.nonResidential}: {nonResidentialCount}</span>
                    </div>
                  </div>

                  {/* Classes & Marhalas */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>{dict.dashboard.activeClasses}</span>
                      <BookMarked className="h-4 w-4 text-amber-600" />
                    </div>
                      <div className="mt-2 text-3xl font-black text-slate-900 font-mono">
                        {totalClasses}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {dict.dashboard.darsNizamiLevels}
                      </div>
                    </div>

                    {/* Today's Attendance */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                        <span>{dict.dashboard.todayAttendance}</span>
                        <CalendarCheck className="h-4 w-4 text-blue-600" />
                      </div>
                        <div className="mt-2 text-3xl font-black text-slate-900 font-mono">
                          {todayAttendance}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {totalStudents > 0
                          ? `${dict.dashboard.attendanceRate}: ${Math.round((todayAttendance / totalStudents) * 100)}%` 
              : dict.common.active}
                        </div>
                      </div>

                      {/* Lillah Boarding */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                          <span>{dict.dashboard.lillahBoarders}</span>
                          <Receipt className="h-4 w-4 text-purple-600" />
                        </div>
                          <div className="mt-2 text-3xl font-black text-slate-900 font-mono">
                            {lillahCount}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {dict.dashboard.zakatWelfare}
                          </div>
                        </div>
                      </div>

                      {/* Role Portals Quick Access Banner */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              {dict.dashboard.rolePortalsTitle}
                            </h2>
                            <span className="text-xs text-slate-400">{dict.dashboard.authorizedAccess}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <Link
                            href="/portals/admin"
                            className="group flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 transition min-h-[48px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">{dict.nav.adminPortal}</span>
                              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 rtl:rotate-270" />
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1">{dict.dashboard.muhtamimDesc}</span>
                          </Link>

                          <Link
                            href="/portals/academic"
                            className="group flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 transition min-h-[48px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">{dict.nav.academicPortal}</span>
                              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 rtl:rotate-270" />
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1">{dict.dashboard.taleematDesc}</span>
                          </Link>

                          <Link
                            href="/portals/faculty"
                            className="group flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 transition min-h-[48px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">{dict.nav.facultyPortal}</span>
                              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 rtl:rotate-270" />
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1">{dict.dashboard.facultyDesc}</span>
                          </Link>

                          <Link
                            href="/portals/bursar"
                            className="group flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 transition min-h-[48px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">{dict.nav.bursarPortal}</span>
                              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 rtl:rotate-270" />
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1">{dict.dashboard.bursarDesc}</span>
                          </Link>
                        </div>
                      </div>

                      {/* Recent Admissions & Database Security Status */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Students Table & Mobile Card List */}
                        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900">
                              {dict.dashboard.recentAdmissions}
                            </h3>
                            <Link
                              href="/dashboard/students"
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                            >
                              <span>{dict.dashboard.viewAllStudents}</span>
                              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                            </Link>
                          </div>

                          {recentStudents.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                              {dict.dashboard.noStudentsYet}
                              <div className="mt-3">
                                <Link
                                  href="/dashboard/students/new"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline min-h-[36px]"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>{dict.dashboard.admitFirstStudent}</span>
                                </Link>
                              </div>
                            </div>
                          ) : (
                                      <>
                                        {/* Mobile Card View (< 640px) */}
                                        <div className="divide-y divide-slate-100 block sm:hidden">
                                          {recentStudents.map((st) => (
                                            <div key={st.id} className="p-4 space-y-2">
                                              <div className="flex items-start justify-between">
                                                <div>
                                                  <div className="font-bold text-sm text-slate-900">
                                                    {locale === 'en' ? st.full_name_en || st.full_name_bn : st.full_name_bn}
                                                  </div>
                                                  <div className="font-mono text-xs text-slate-400 mt-0.5">
                                                    {st.admission_no}
                                                  </div>
                                                </div>
                                                <span className="font-mono text-[10px] text-slate-400">
                                                  {new Date(st.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'bn-BD')}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-2 pt-1">
                                                {st.is_residential ? (
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                                                    <Home className="h-2.5 w-2.5" />
                                                    <span>{dict.dashboard.residential}</span>
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                                    {dict.dashboard.nonResidential}
                                                  </span>
                                                )}

                                                {st.is_lillah_boarder && (
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200">
                                                    <HeartHandshake className="h-2.5 w-2.5" />
                                                    <span>{locale === 'ar' ? 'طالب اللله' : locale === 'en' ? 'Lillah Boarder' : 'লিল্লাহ প্রাপক'}</span>
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Desktop Table View (>= 640px) */}
                                        <div className="hidden sm:block overflow-x-auto">
                                          <table className="w-full text-left rtl:text-right text-sm">
                                            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                                              <tr>
                                                <th className="px-4 py-2.5">{dict.common.code}</th>
                                                <th className="px-4 py-2.5">{dict.common.name}</th>
                                                <th className="px-4 py-2.5">{dict.dashboard.residentialRatio}</th>
                                                <th className="px-4 py-2.5">{dict.dashboard.lillahBoarders}</th>
                                                <th className="px-4 py-2.5 text-right rtl:text-left">{dict.common.date}</th>
                                              </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {recentStudents.map((st) => (
                                          <tr key={st.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                                              {st.admission_no}
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="font-semibold text-slate-900">
                                                {locale === 'en' ? st.full_name_en || st.full_name_bn : st.full_name_bn}
                                              </div>
                                              {st.full_name_en && locale !== 'en' && (
                                                <div className="text-xs text-slate-400">{st.full_name_en}</div>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                              {st.is_residential ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                                                  <Home className="h-3 w-3" />
                                                  <span>{dict.dashboard.residential}</span>
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                                                  {dict.dashboard.nonResidential}
                                                </span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                              {st.is_lillah_boarder ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200">
                                                  <HeartHandshake className="h-3 w-3 text-purple-600" />
                                                  <span>{locale === 'ar' ? 'طالب اللله' : locale === 'en' ? 'Lillah Boarder' : 'লিল্লাহ প্রাপক'}</span>
                                                </span>
                                              ) : (
                                                <span className="text-slate-400 text-xs">
                                                  {locale === 'ar' ? 'عام' : locale === 'en' ? 'General' : 'সাধারণ'}
                                                </span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-right rtl:text-left text-xs font-mono text-slate-500">
                                              {new Date(st.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'bn-BD')}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
              </div>
                              </>
          )}
                            </div>

        {/* Database & RLS Security Status */}
                          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-5 w-5 text-emerald-600" />
                              <h3 className="text-sm font-bold text-slate-900">
                                {dict.settings.securityTitle}
                              </h3>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed">
                              {dict.settings.rlsGuarantee}
                            </p>

                            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                              <div className="flex items-center justify-between text-slate-600">
                                <span>{locale === 'ar' ? 'عزل البيانات:' : locale === 'en' ? 'Data Isolation:' : 'টেন্যান্ট আইসোলেশন:'}</span>
                                <span className="font-semibold text-emerald-700">Strict RLS Active</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-600">
                                <span>{locale === 'ar' ? 'سجل التدقيق:' : locale === 'en' ? 'Audit Log:' : 'অডিট লগিং:'}</span>
                                <span className="font-semibold text-emerald-700">Append-Only Active</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-600">
                                <span>{locale === 'ar' ? 'خادم السحابة:' : locale === 'en' ? 'Server Cluster:' : 'সার্ভার ক্লাস্টার:'}</span>
                                <span className="font-mono text-[11px] text-slate-500">ap-south-1 (Mumbai)</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-600">
                                <span>{locale === 'ar' ? 'إصدار القاعدة:' : locale === 'en' ? 'PostgreSQL:' : 'ডেটাবেস ভার্সন:'}</span>
                                <span className="font-mono text-[11px] text-slate-500">PostgreSQL 17.6</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
}
