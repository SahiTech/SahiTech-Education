import React from 'react';
import Link from 'next/link';
import { QAWMI_MARHALAS } from '@sahitech/domain';
import { BookOpen, Layers, Award, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

  export default async function AcademicEnginePage() {
    const dict = await getServerDictionary();
    const locale = await getServerLocale();
    const direction = await getServerDirection();

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {dict.academic.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {dict.academic.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/academic/exams"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <Award className="h-4 w-4 text-emerald-700" />
              <span>{dict.academic.examsTitle}</span>
            </Link>
            <Link
              href="/dashboard/academic/sanad"
              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-200" />
              <span>{dict.sanad.title}</span>
            </Link>
          </div>
        </div>

        {/* Engine Switcher / Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-emerald-600 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{dict.academic.defaultEngine}</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">{dict.common.active}</span>
            </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{dict.academic.qawmiTitle}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {dict.academic.qawmiDesc}
              </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm opacity-90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{dict.academic.boardEngine}</span>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">{dict.common.active}</span>
            </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{dict.academic.aliaTitle}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {dict.academic.aliaDesc}
              </p>
          </div>
        </div>

        {/* Marhala List */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-700" />
              <span>{dict.academic.qawmiTitle}</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">{dict.academic.marhalasCount}: {QAWMI_MARHALAS.length}</span>
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
                      {locale === 'en' ? marhala.name.en : locale === 'ar' && marhala.name.ar ? marhala.name.ar : marhala.name.bn}
                    </h3>
                      {
                        marhala.name.ar && locale !== 'ar' && (
                          <span className="text-xs text-emerald-800 font-serif mr-2" dir="rtl">
                            {marhala.name.ar}
                          </span>
                        )
                      }
                </div>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                      {locale === 'en' ? marhala.description.en : marhala.description.bn}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 md:justify-end max-w-md">
                  {marhala.canonicalKitabs.map((kitab, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700 border border-slate-200/60"
                    >
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
