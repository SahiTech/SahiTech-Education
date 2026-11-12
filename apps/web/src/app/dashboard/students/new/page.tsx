import React from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewStudentForm } from './new-student-form';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function NewStudentPage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
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
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {dict.students.formTitle}
          </h1>
          <p className="text-xs text-slate-500">
            {context.tenantName} · {dict.students.directorySubtitle}
          </p>
        </div>
      </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <NewStudentForm classes={classes || []} />
        </div>
      </div>
      );
}
