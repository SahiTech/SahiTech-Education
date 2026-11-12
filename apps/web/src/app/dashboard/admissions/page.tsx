import React from 'react';
import Link from 'next/link';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { UserCheck, Plus, Search, Filter, Phone, Calendar, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import { AdmissionEvaluationModal } from './admission-modal';

export const dynamic = 'force-dynamic';

export default async function AdmissionsPage() {
  const context = await getActiveTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  const [admissionsRes, classesRes] = await Promise.all([
    supabase
      .from('student_admissions')
      .select(`
        id,
        application_no,
        full_name_bn,
        full_name_en,
        guardian_phone,
        status,
        written_exam_marks,
        oral_exam_marks,
        is_residential_applicant,
        is_lillah_applicant,
        created_at,
        classes:target_class_id (name_bn)
      `)
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('classes')
      .select('id, name_bn')
      .eq('tenant_id', context.tenantId),
  ]);

  const admissions = admissionsRes.data || [];
  const classes = classesRes.data || [];

  const statusBadges: Record<string, { label: string; color: string }> = {
    applied: { label: 'আবেদন জমা', color: 'bg-blue-100 text-blue-800' },
    exam_scheduled: { label: 'পরীক্ষা নির্ধারিত', color: 'bg-amber-100 text-amber-800' },
    passed: { label: 'উত্তীর্ণ (ভর্তির যোগ্য)', color: 'bg-emerald-100 text-emerald-800' },
    enrolled: { label: 'ভর্তি সম্পন্ন', color: 'bg-purple-100 text-purple-800' },
    rejected: { label: 'অননুমোদিত', color: 'bg-red-100 text-red-800' },
    inquiry: { label: 'অনুসন্ধান', color: 'bg-slate-100 text-slate-800' },
    cancelled: { label: 'বাতিল', color: 'bg-slate-100 text-slate-500' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              নতুন ভর্তি ও দাখেলা ব্যবস্থাপনা (Admissions & Evaluation)
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-700">
              আবেদন: {admissions.length}টি
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · আবেদন গ্রহণ, লিখিত ও মৌখিক সবক পরীক্ষা এবং ভর্তি নিশ্চিতকরণ।
          </p>
        </div>

        <Link
          href="/dashboard/students/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
        >
          <Plus className="h-4 w-4" />
          সরাসরি দাখেলা ফরম
        </Link>
      </div>

      {/* Applications Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {admissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <UserCheck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">কোনো ভর্তি আবেদন নেই</h3>
            <p className="text-xs text-slate-500 mt-1">নতুন আবেদনকারী আসলে এখানে প্রদর্শিত হবে।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">আবেদন নং</th>
                  <th className="px-4 py-3">শিক্ষার্থীর নাম</th>
                  <th className="px-4 py-3">মোবাইল</th>
                  <th className="px-4 py-3">লিখিত / মৌখিক নম্বর</th>
                  <th className="px-4 py-3">আবাসিক ও লিল্লাহ</th>
                  <th className="px-4 py-3">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admissions.map((app) => {
                  const badge = statusBadges[app.status] || { label: app.status, color: 'bg-slate-100' };
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900">
                        {app.application_no}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{app.full_name_bn}</div>
                        <div className="text-xs text-slate-500">{app.full_name_en}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                        {app.guardian_phone}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono">
                        {app.written_exam_marks != null ? `লিখিত: ${app.written_exam_marks}` : '—'} /{' '}
                        {app.oral_exam_marks != null ? `মৌখিক: ${app.oral_exam_marks}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className="flex items-center gap-1">
                          {app.is_residential_applicant && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 border border-blue-200">
                              আবাসিক
                            </span>
                          )}
                          {app.is_lillah_applicant && (
                            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-700 border border-purple-200">
                              লিল্লাহ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs">
                        <AdmissionEvaluationModal application={app} classes={classes} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

