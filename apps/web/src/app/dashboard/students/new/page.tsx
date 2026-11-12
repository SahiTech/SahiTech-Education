import React from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewStudentForm } from './new-student-form';

export const dynamic = 'force-dynamic';

export default async function NewStudentPage() {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Fetch classes and sections for selection
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name_bn, name_en')
    .eq('tenant_id', context.tenantId)
    .order('level_order', { ascending: true });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link
          href="/dashboard/students"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            নতুন শিক্ষার্থী ভর্তি ফরম (New Student Admission)
          </h1>
          <p className="text-xs text-slate-500">
            {context.tenantName} · শিক্ষার্থী ডাটাবেজ অন্তর্ভুক্তি
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <NewStudentForm classes={classes || []} />
      </div>
    </div>
  );
}

