import React from 'react';
import { requirePermission } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { Receipt, ShieldAlert, HeartHandshake, Building, CreditCard, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BursarPortalPage() {
  // Enforce fee collection & financial authority
  const context = await requirePermission('collect_payments');
  const supabase = await createClient();

  const [categoriesRes, invoicesRes] = await Promise.all([
    supabase
      .from('fee_categories')
      .select('*')
      .eq('tenant_id', context.tenantId),
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
  ]);

  const categories = categoriesRes.data || [];
  const invoices = invoicesRes.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              হিসাব ও ক্যাশ কাউন্টার পোর্টাল (Bursar & Finance Desk)
            </h1>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
              শরীয়াহ তহবিল ও অর্থ বিভাগ
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · ফি আদায়, রশিদ মুদ্রণ ও তহবিল পৃথকীকরণ রেজিস্টার।
          </p>
        </div>
      </div>

      {/* Document 26 Shariah Fund Segregation Advisory */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <HeartHandshake className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-purple-950">
              শরীয়াহ তহবিল পৃথকীকরণ নীতি সক্রিয় (Shariah Fund Segregation — Doc 26)
            </h3>
            <p className="text-xs text-purple-900 leading-relaxed">
              এমডিআই আর্কিটেকচার অনুযায়ী যাকাত ও লিল্লাহ বোর্ডিং ফান্ড সাধারণ প্রাতিষ্ঠানিক ফান্ড হতে সম্পূর্ণ পৃথক লেজারে সংরক্ষিত হয়। যাকাত ও ফিতরাহ তহবিলের অর্থ কেবলমাত্র হকদার এতিম ও দরিদ্র শিক্ষার্থীদের খোরাকি বাবদ ব্যয়যোগ্য।
            </p>
          </div>
        </div>
      </div>

      {/* Funds Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>সাধারণ প্রাতিষ্ঠানিক তহবিল</span>
            <Building className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">তহবিল নং ১</div>
          <p className="mt-1 text-xs text-slate-500">বেতন, ভর্তি ফি ও প্রাতিষ্ঠানিক উন্নয়ন</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>লিল্লাহ বোর্ডিং ও যাকাত তহবিল</span>
            <HeartHandshake className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-900">তহবিল নং ২</div>
          <p className="mt-1 text-xs text-slate-500">দরিদ্র ও এতিম তালিবুল ইলমদের খোরাকি</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>সদকাহ ও দান বাক্স তহবিল</span>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">তহবিল নং ৩</div>
          <p className="mt-1 text-xs text-slate-500">এককালীন সাধারণ অনুদান ও মেহমানদারি</p>
        </div>
      </div>

      {/* Invoices and Categories Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-slate-700" />
            অনুমোদিত ফি হেড / খাতসমূহ
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {categories.length === 0 ? (
              <p className="text-slate-400 py-3">কোনো ফি খাত তৈরি হয়নি।</p>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{c.name_bn}</span>
                  <span className="text-slate-400 font-mono">{c.is_recurring ? 'মাসিক' : 'এককালীন'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Invoices Ledger */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              সাম্প্রতিক ফি ভাউচার ও রসিদ (Recent Invoices)
            </h3>
            <span className="text-xs text-slate-400 font-mono">কাউন্টার খাতা</span>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              এখনো কোনো ফি ইনভয়েস তৈরি করা হয়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">রশিদ নং</th>
                    <th className="px-4 py-2.5">শিক্ষার্থীর নাম</th>
                    <th className="px-4 py-2.5">খাত</th>
                    <th className="px-4 py-2.5">পরিমাণ</th>
                    <th className="px-4 py-2.5 text-right">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const st = inv.students as any;
                    const cat = inv.fee_categories as any;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="font-semibold text-slate-900">{st?.full_name_bn}</span>
                          <span className="block font-mono text-slate-400">{st?.admission_no}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {cat?.name_bn || 'সাধারণ'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                          ৳ {inv.amount}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {inv.status}
                          </span>
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
    </div>
  );
}
