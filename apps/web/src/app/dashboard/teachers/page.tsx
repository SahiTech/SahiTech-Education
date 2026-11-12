import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { TeachersView } from './teachers-view';
import { GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeachersDirectoryPage() {
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        আসতিযা ও স্টাফ তালিকা দেখার জন্য অনুগ্রহ করে প্রথমে লগইন করুন।
      </div>
    );
  }

  const supabase = await createClient();

  const [teachersRes, leavesRes] = await Promise.all([
    supabase
      .from('teachers')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('staff_leaves')
      .select(`
        id,
        leave_type,
        start_date,
        end_date,
        days_count,
        reason,
        status,
        created_at,
        teachers:teacher_id (full_name_bn, designation)
      `)
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false }),
  ]);

  const teachers = teachersRes.data || [];
  const leaves = leavesRes.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              আসতিযায়ে কিরাম ও স্টাফ সার্ভিস রেজিস্ট্রি (Teachers & Staff)
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              মানবসম্পদ ও খেদমত বই
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · শিক্ষকগণের পরিচিতি, পদবী, শিক্ষাগত যোগ্যতা ও ছুটির ব্যবস্থাপনা।
          </p>
        </div>
      </div>

      <TeachersView teachers={teachers} leaves={leaves} />
    </div>
  );
}

