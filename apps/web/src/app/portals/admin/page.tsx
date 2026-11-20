import React from 'react';
import Link from 'next/link';
import { requirePermission } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { Building2, Users, GitBranch, History, CheckCircle2, ExternalLink } from 'lucide-react';
import { getServerDictionary, getServerLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function MuhtamimAdminPortalPage() {
  const [context, dict, locale] = await Promise.all([
    requirePermission('manage_tenant_settings'),
    getServerDictionary(),
    getServerLocale(),
  ]);
  const copy = dict.portals.admin;
  const supabase = await createClient();

  const [tenantRes, branchesRes, staffRes, auditLogsRes] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', context.tenantId).single(),
    supabase.from('branches').select('*').eq('tenant_id', context.tenantId),
    supabase.from('tenant_users').select('id, role, is_active, profiles:user_id(full_name_bn, full_name_en, phone)').eq('tenant_id', context.tenantId),
    supabase.from('audit_logs').select('*').eq('tenant_id', context.tenantId).order('created_at', { ascending: false }).limit(8),
  ]);

  const tenant = tenantRes.data;
  const branches = branchesRes.data || [];
  const staff = staffRes.data || [];
  const auditLogs = auditLogsRes.data || [];
  const publicUrl = tenant?.subdomain
    ? `https://sahitech.dpdns.org/m/${encodeURIComponent(tenant.subdomain)}`
    : null;
  const dateLocale = locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-GB' : 'bn-BD';
  const roleLabels: Record<string, Record<string, string>> = {
    madrasa_admin: { bn: 'মুহতামিম / প্রিন্সিপাল', en: 'Madrasa Admin / Principal', ar: 'مدير المدرسة' },
    academic_dean: { bn: "নাজেমে তা'লীমাত", en: 'Academic Dean', ar: 'الناظر الأكاديمي' },
    teacher: { bn: 'শিক্ষক / উস্তাদ', en: 'Teacher / Ustadh', ar: 'المعلم' },
    accountant: { bn: 'হিসাবরক্ষক', en: 'Accountant', ar: 'المحاسب' },
    hostel_warden: { bn: 'হোস্টেল তত্ত্বাবধায়ক', en: 'Hostel Warden', ar: 'مشرف السكن' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{copy.title}</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{copy.badge}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{context.tenantName} · {copy.subtitle}</p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900"><Building2 className="h-5 w-5 text-emerald-700" />{copy.profileTitle}</h2>
        <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
          <div><span className="block text-xs font-medium text-slate-400">{copy.institutionName}</span><span className="font-semibold text-slate-900">{tenant?.name || context.tenantName}</span></div>
          <div><span className="block text-xs font-medium text-slate-400">{copy.institutionCode}</span><span className="font-mono font-semibold text-slate-900">{tenant?.code || context.tenantCode}</span></div>
          <div>
            <span className="block text-xs font-medium text-slate-400">{copy.publicWebsite}</span>
            {publicUrl ? (
              <Link href={publicUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 break-all font-mono text-xs font-semibold text-emerald-700 hover:underline">
                {publicUrl}<ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </Link>
            ) : <span className="text-slate-500">{copy.notConnected}</span>}
            <p className="mt-1 text-[11px] leading-5 text-slate-500">{copy.publicWebsiteHelp}</p>
          </div>
          <div><span className="block text-xs font-medium text-slate-400">{copy.curriculum}</span><span className="font-semibold capitalize text-slate-900">{tenant?.curriculum_type || context.curriculumType}</span></div>
          <div><span className="block text-xs font-medium text-slate-400">{copy.contactPhone}</span><span className="font-mono text-slate-700">{tenant?.contact_phone || copy.notConnected}</span></div>
          <div><span className="block text-xs font-medium text-slate-400">{copy.contactEmail}</span><span className="font-mono text-slate-700">{tenant?.contact_email || copy.notConnected}</span></div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><GitBranch className="h-5 w-5 text-blue-600" />{copy.branches}</h3>
            <span className="text-xs font-mono font-bold text-slate-500">{branches.length}{copy.branchCount}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {branches.map((branch: any) => (
              <div key={branch.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                    {branch.name}
                    {branch.is_main_branch && <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{copy.mainBranch}</span>}
                  </div>
                  <div className="font-mono text-xs text-slate-400">{copy.branchCode}: {branch.code}</div>
                </div>
                <div className="text-right text-xs text-slate-500">{branch.address || copy.addressNotSet}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><Users className="h-5 w-5 text-purple-600" />{copy.staff}</h3>
            <span className="text-xs font-mono font-bold text-slate-500">{staff.length}{copy.staffCount}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {staff.map((member: any) => {
              const profile = member.profiles as any;
              const name = locale === 'en' ? profile?.full_name_en || profile?.full_name_bn : profile?.full_name_bn || profile?.full_name_en;
              return (
                <div key={member.id} className="flex items-center justify-between gap-3 py-3">
                  <div><div className="font-semibold text-slate-900">{name || copy.userFallback}</div><div className="font-mono text-xs text-slate-400">{profile?.phone || ''}</div></div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">{roleLabels[member.role]?.[locale] || member.role}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><History className="h-5 w-5 text-emerald-700" />{copy.auditTitle}</h3>
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{copy.immutableLog}</span>
        </div>
        {auditLogs.length === 0 ? <p className="py-4 text-xs text-slate-400">{copy.noAudit}</p> : (
          <div className="divide-y divide-slate-100 font-mono text-xs">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="flex flex-col justify-between gap-2 py-2.5 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-800">{log.action}</span>
                  <span className="text-slate-600">[{log.entity_name} : {log.entity_id?.slice(0, 8)}]</span>
                  <span className="text-slate-400">{copy.actor}: {log.actor_role}</span>
                </div>
                <span className="text-[11px] text-slate-400">{new Date(log.created_at).toLocaleString(dateLocale)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
