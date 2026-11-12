import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { Receipt, Landmark, HeartHandshake, CreditCard, Plus, ArrowUpRight, ShieldCheck, BookOpen } from 'lucide-react';
import { FinanceViews } from './finance-views';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const context = await getActiveTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  const [accountsRes, entriesRes, invoicesRes, studentsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('code'),
    supabase
      .from('journal_entries')
      .select(`
        id,
        entry_number,
        entry_date,
        fund_type,
        narration,
        is_posted,
        created_at,
        journal_entry_lines (debit, credit, memo, accounts (name_bn, code))
      `)
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('fee_invoices')
      .select(`
        id,
        invoice_number,
        amount,
        paid_amount,
        status,
        due_date,
        students:student_id (full_name_bn, admission_no),
        fee_categories:fee_category_id (name_bn)
      `)
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('students')
      .select('id, full_name_bn, admission_no')
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true),
  ]);

  const accounts = accountsRes.data || [];
  const entries = entriesRes.data || [];
  const invoices = invoicesRes.data || [];
  const students = studentsRes.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              হিসাব ও দ্বি-তরফা দাখিলা ফাইন্যান্স (Double-Entry Financial Accounting)
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Document 26 Compliant
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · সাধারণ প্রাতিষ্ঠানিক তহবিল ও লিল্লাহ যাকাত তহবিলের পৃথক লেজার ও ভাউচার রেজিস্টার।
          </p>
        </div>
      </div>

      {/* Financial Views Component */}
      <FinanceViews
        accounts={accounts}
        entries={entries}
        invoices={invoices}
        students={students}
      />
    </div>
  );
}
