import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import {
  Settings,
  Building2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Layers,
  Globe,
  Phone,
  Mail,
  MapPin,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        {dict.settings.subtitle}
      </div>
    );
  }

  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', context.tenantId)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {dict.settings.title}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {dict.common.active}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · {dict.settings.subtitle}
          </p>
        </div>

        <Link
          href="/onboarding"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition inline-flex items-center gap-1.5 min-h-[40px]"
        >
          <Sparkles className="h-4 w-4" />
          <span>{locale === 'ar' ? 'معالج الإعداد' : locale === 'en' ? 'Setup Wizard' : 'সেটআপ উইজার্ড'}</span>
        </Link>
      </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Institutional Profile */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-base font-bold text-slate-900">
                    {dict.settings.profileTitle}
                  </h2>
                </div>

                <div className="space-y-3 text-xs divide-y divide-slate-100">
                  <div className="flex items-center justify-between pt-2 text-slate-600">
                    <span>{dict.settings.institutionalName}:</span>
                    <strong className="text-slate-900">{tenant?.name}</strong>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-slate-600">
                    <span>{dict.settings.institutionalCode}:</span>
                    <span className="font-mono font-bold text-slate-800">{tenant?.code}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-slate-600">
                    <span>{dict.settings.subdomain}:</span>
                    <span className="font-mono text-emerald-700">{tenant?.subdomain}.sahitech.edu</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-slate-600">
                    <span>{dict.settings.curriculumType}:</span>
                    <span className="capitalize font-semibold text-slate-800">
                      {tenant?.curriculum_type === 'qawmi' ? dict.academic.qawmiTitle : dict.academic.aliaTitle}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-slate-600">
                    <span>{dict.settings.establishedYear}:</span>
                    <span className="font-mono">{tenant?.established_year || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-slate-600">
                    <span>{dict.settings.contactPhone}:</span>
                    <span className="font-mono">{tenant?.contact_phone || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-slate-600">
                    <span>{dict.settings.contactEmail}:</span>
                    <span className="font-mono">{tenant?.contact_email || '—'}</span>
                  </div>

                    <div className="flex items-center justify-between pt-2 text-slate-600">
                      <span>{dict.settings.district}:</span>
                      <span>{tenant?.district || '—'}</span>
                    </div>
                  </div>
                </div>

                    {/* Zero-Trust Architecture Security Guarantees */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-700" />
                        <h2 className="text-base font-bold text-slate-900">
                          {dict.settings.securityTitle}
                        </h2>
                      </div>

                            <div className="space-y-4 pt-1">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-xs font-bold text-slate-900 block">
                                    PostgreSQL Row Level Security (RLS)
                                  </strong>
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                    {dict.settings.rlsGuarantee}
                                  </p>
                                </div>
                              </div>

                                <div className="flex items-start gap-3">
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-xs font-bold text-slate-900 block">
                                      Document 26 Shariah Fund Segregation
                                    </strong>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                      {dict.settings.fundSegregationGuarantee}
                                    </p>
                                  </div>
                                </div>

                                  <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="text-xs font-bold text-slate-900 block">
                                        Cryptographic Sanad Integrity
                                      </strong>
                                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                        {dict.settings.sanadGuarantee}
                                      </p>
                                    </div>
                                  </div>

                                    <div className="flex items-start gap-3">
                                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="text-xs font-bold text-slate-900 block">
                                          Immutable Audit Trail
                                        </strong>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                          {dict.settings.auditGuarantee}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            );
}
