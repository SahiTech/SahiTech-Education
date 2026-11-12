import React from 'react';
import { requirePermission } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { Building2, Shield, Users, GitBranch, History, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MuhtamimAdminPortalPage() {
  // Enforce institutional administrative authority
  const context = await requirePermission('manage_tenant_settings');
  const supabase = await createClient();

  const [tenantRes, branchesRes, staffRes, auditLogsRes] = await Promise.all([
    supabase
      .from('tenants')
      .select('*')
      .eq('id', context.tenantId)
      .single(),
    supabase
      .from('branches')
      .select('*')
      .eq('tenant_id', context.tenantId),
    supabase
      .from('tenant_users')
      .select('id, role, is_active, profiles:user_id(full_name_bn, full_name_en, phone)')
      .eq('tenant_id', context.tenantId),
    supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const tenant = tenantRes.data;
  const branches = branchesRes.data || [];
  const staff = staffRes.data || [];
  const auditLogs = auditLogsRes.data || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              মুহতামিম প্রশাসনিক নিয়ন্ত্রণ পোর্টাল
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              প্রধান প্রশাসনিক কর্তৃত্ব
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · প্রাতিষ্ঠানিক নীতি, শাখা ব্যবস্থাপনা ও নিরাপত্তা নিরীক্ষা।
          </p>
        </div>
      </div>

      {/* Madrasa Profile Details */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-emerald-700" />
          প্রতিষ্ঠান বিবরণ ও স্বীকৃতি
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-400 block font-medium">প্রতিষ্ঠানের নাম</span>
            <span className="font-semibold text-slate-900">{tenant?.name}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">প্রাতিষ্ঠানিক কোড</span>
            <span className="font-mono font-semibold text-slate-900">{tenant?.code}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">সাবডোমেন / ডোমেন</span>
            <span className="font-mono text-emerald-700">{tenant?.subdomain}.sahitech-edu.com</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">পাঠ্যক্রম কাঠামো</span>
            <span className="font-semibold text-slate-900 capitalize">{tenant?.curriculum_type}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">যোগাযোগ ফোন</span>
            <span className="font-mono text-slate-700">{tenant?.contact_phone || 'সংযুক্ত নেই'}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">যোগাযোগ ইমেইল</span>
            <span className="font-mono text-slate-700">{tenant?.contact_email || 'সংযুক্ত নেই'}</span>
          </div>
        </div>
      </div>

      {/* Branches & Staff Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branches */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              শাখাসমূহ
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              {branches.length}টি শাখা
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {branches.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    {b.name}
                    {b.is_main_branch && (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        প্রধান শাখা
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">কোড: {b.code}</div>
                </div>
                <div className="text-xs text-slate-500">{b.address || 'ঠিকানা নির্ধারিত নেই'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff / Admins */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              প্রশাসনিক ও একাডেমিক দায়িত্বপ্রাপ্ত সদস্য
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              {staff.length} জন
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {staff.map((s) => {
              const p = s.profiles as any;
              return (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {p?.full_name_bn || p?.full_name_en || 'ব্যবহারকারী'}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{p?.phone || ''}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                    {s.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audit Log Stream (Document 27 Compliance) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-700" />
            নিরাপত্তা ও অ্যাক্টিভিটি অডিট লগ
          </h3>
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Immutable Append-Only Log
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">এখনো কোনো অডিট ইভেন্ট রেকর্ড হয়নি।</p>
        ) : (
          <div className="divide-y divide-slate-100 font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                    {log.action}
                  </span>
                  <span className="text-slate-600">
                    [{log.entity_name} : {log.entity_id?.slice(0, 8)}]
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    কর্তৃক: {log.actor_role}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  {new Date(log.created_at).toLocaleString('bn-BD')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

