import React from 'react';
import { requirePermission } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { QAWMI_MARHALAS } from '@sahitech/domain';
import { BookMarked, Calendar, Layers, BookOpen, Award } from 'lucide-react';
import { getServerDictionary, getServerLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function NazimeTaleematPortalPage() {
  const [context, dict, locale] = await Promise.all([
    requirePermission('manage_curriculum'),
    getServerDictionary(),
    getServerLocale(),
  ]);
  const copy = dict.portals.academic;
  const supabase = await createClient();

  const [departmentsRes, classesRes, academicYearRes] = await Promise.all([
    supabase.from('departments').select('*').eq('tenant_id', context.tenantId),
    supabase.from('classes').select('*').eq('tenant_id', context.tenantId).order('level_order', { ascending: true }),
    supabase.from('academic_years').select('*').eq('tenant_id', context.tenantId).eq('is_current', true).maybeSingle(),
  ]);

  const departments = departmentsRes.data || [];
  const classes = classesRes.data || [];
  const currentYear = academicYearRes.data;
  const localizedName = (bn?: string | null, en?: string | null) =>
    locale === 'en' ? en || bn || '' : bn || en || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{copy.title}</h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">{copy.badge}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{context.tenantName} · {copy.subtitle}</p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900"><Calendar className="h-5 w-5 text-emerald-700" />{copy.academicYear}</h2>
        {currentYear ? (
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-4">
            <div><span className="block text-xs font-medium text-slate-400">{copy.yearName}</span><span className="font-bold text-slate-900">{localizedName(currentYear.name_bn, currentYear.name_en)}</span></div>
            <div><span className="block text-xs font-medium text-slate-400">{copy.hijriYear}</span><span className="font-semibold text-slate-900">{currentYear.hijri_year || '১৪৪৭-১৪৪৮'} {copy.hijriSuffix}</span></div>
            <div><span className="block text-xs font-medium text-slate-400">{copy.startDate}</span><span className="font-mono text-slate-700">{currentYear.start_date}</span></div>
            <div><span className="block text-xs font-medium text-slate-400">{copy.endDate}</span><span className="font-mono text-slate-700">{currentYear.end_date}</span></div>
          </div>
        ) : <p className="text-xs text-amber-700">{copy.noCurrentYear}</p>}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900"><Layers className="h-5 w-5 text-purple-600" />{copy.departments}</h3>
          <div className="divide-y divide-slate-100">
            {departments.length === 0 ? <p className="py-3 text-xs text-slate-400">{copy.noDepartments}</p> : departments.map((department: any) => (
              <div key={department.id} className="flex items-center justify-between gap-3 py-2.5">
                <div><div className="text-sm font-bold text-slate-900">{localizedName(department.name_bn, department.name_en)}</div>{locale !== 'en' && department.name_en && <div className="text-xs text-slate-400">{department.name_en}</div>}</div>
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">{department.code}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900"><BookMarked className="h-5 w-5 text-emerald-700" />{copy.classes}</h3>
          <div className="divide-y divide-slate-100">
            {classes.length === 0 ? <p className="py-3 text-xs text-slate-400">{copy.noClasses}</p> : classes.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <div><div className="text-sm font-bold text-slate-900">{localizedName(item.name_bn, item.name_en)}</div>{locale !== 'en' && item.name_en && <div className="text-xs text-slate-400">{item.name_en}</div>}</div>
                <div className="flex shrink-0 items-center gap-2"><span className="text-xs text-slate-500">{copy.levelOrder}: {item.level_order}</span><span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] text-emerald-800">{item.code}</span></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {context.curriculumType === 'qawmi' || context.curriculumType === 'hybrid' ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900"><Award className="h-5 w-5 text-amber-600" />{copy.qawmiMapTitle}</h3>
          <p className="mb-4 text-xs text-slate-500">{copy.qawmiMapDescription}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {QAWMI_MARHALAS.slice(0, 6).map((marhala) => (
              <div key={marhala.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{marhala.name[locale] || marhala.name.en}</span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">{marhala.code}</span>
                </div>
                <p className="text-[11px] leading-5 text-slate-600">{marhala.description[locale] || marhala.description.en}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {marhala.canonicalKitabs.map((kitab, index) => <span key={index} className="inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-700"><BookOpen className="mr-1 h-2.5 w-2.5 text-emerald-700" />{kitab}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
