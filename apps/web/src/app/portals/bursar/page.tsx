import React from 'react';
import { requirePermission } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { Receipt, HeartHandshake, Building, CreditCard } from 'lucide-react';
import { getServerDictionary, getServerLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function BursarPortalPage() {
  const [context, dict, locale] = await Promise.all([
    requirePermission('collect_payments'),
    getServerDictionary(),
    getServerLocale(),
  ]);
  const copy = dict.portals.bursar;
  const supabase = await createClient();

  const [categoriesRes, invoicesRes] = await Promise.all([
    supabase.from('fee_categories').select('*').eq('tenant_id', context.tenantId),
    supabase.from('fee_invoices').select(`
      id, invoice_number, amount, paid_amount, status, due_date,
      students:student_id (full_name_bn, full_name_en, admission_no),
      fee_categories:fee_category_id (name_bn, name_en)
    `).eq('tenant_id', context.tenantId).order('created_at', { ascending: false }).limit(10),
  ]);
  const categories = categoriesRes.data || [];
  const invoices = invoicesRes.data || [];
  const localizedName = (bn?: string | null, en?: string | null) => locale === 'en' ? en || bn || '' : bn || en || '';

  const funds = [
    { title: copy.generalFund, code: copy.fundOne, description: copy.generalFundDescription, icon: Building, tone: 'emerald' },
    { title: copy.lillahFund, code: copy.fundTwo, description: copy.lillahFundDescription, icon: HeartHandshake, tone: 'purple' },
    { title: copy.donationFund, code: copy.fundThree, description: copy.donationFundDescription, icon: CreditCard, tone: 'blue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{copy.title}</h1>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">{copy.badge}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{context.tenantName} · {copy.subtitle}</p>
        </div>
      </div>

      <section className="rounded-xl border border-purple-200 bg-purple-50/70 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
          <div className="space-y-1"><h3 className="text-sm font-bold text-purple-950">{copy.policyTitle}</h3><p className="text-xs leading-relaxed text-purple-900">{copy.policyDescription}</p></div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {funds.map((fund) => {
          const Icon = fund.icon;
          const theme = fund.tone === 'purple'
            ? 'border-purple-200 text-purple-900'
            : fund.tone === 'blue'
              ? 'border-slate-200 text-slate-900'
              : 'border-slate-200 text-slate-900';
          return (
            <section key={fund.code} className={`rounded-xl border bg-white p-5 shadow-sm ${theme}`}>
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                <span>{fund.title}</span><Icon className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black">{fund.code}</div>
              <p className="mt-1 text-xs text-slate-500">{fund.description}</p>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><Receipt className="h-4 w-4 text-slate-700" />{copy.feeCategories}</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {categories.length === 0 ? <p className="py-3 text-slate-400">{copy.noFeeCategories}</p> : categories.map((category: any) => (
              <div key={category.id} className="flex items-center justify-between gap-2 py-2.5">
                <span className="font-semibold text-slate-800">{localizedName(category.name_bn, category.name_en)}</span>
                <span className="font-mono text-slate-400">{category.is_recurring ? copy.monthly : copy.oneTime}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">{copy.invoices}</h3>
            <span className="font-mono text-xs text-slate-400">{copy.cashLedger}</span>
          </div>
          {invoices.length === 0 ? <div className="p-8 text-center text-xs text-slate-400">{copy.noInvoices}</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm rtl:text-right">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">{copy.receiptNo}</th><th className="px-4 py-2.5">{copy.studentName}</th><th className="px-4 py-2.5">{copy.feeHead}</th><th className="px-4 py-2.5">{copy.amount}</th><th className="px-4 py-2.5">{copy.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice: any) => {
                    const student = invoice.students as any;
                    const category = invoice.fee_categories as any;
                    return (
                      <tr key={invoice.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{invoice.invoice_number}</td>
                        <td className="px-4 py-3 text-xs"><span className="font-semibold text-slate-900">{student ? localizedName(student.full_name_bn, student.full_name_en) : ''}</span><span className="block font-mono text-slate-400">{student?.admission_no}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{category ? localizedName(category.name_bn, category.name_en) : copy.general}</td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">৳ {invoice.amount}</td>
                        <td className="px-4 py-3 text-xs"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">{invoice.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
