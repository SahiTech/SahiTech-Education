'use client';

import React, { useState } from 'react';
import {
  initializeDefaultChartOfAccounts,
  createJournalVoucher,
  collectFeePayment,
} from '@/app/actions/finance';
import {
  Landmark,
  Receipt,
  HeartHandshake,
  CreditCard,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
} from 'lucide-react';

interface FinanceViewsProps {
  accounts: any[];
  entries: any[];
  invoices: any[];
  students: any[];
}

export function FinanceViews({ accounts, entries, invoices, students }: FinanceViewsProps) {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'accounts' | 'invoices'>('vouchers');
  const [modalType, setModalType] = useState<'none' | 'voucher' | 'collect_fee'>('none');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Journal Voucher Form State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [fundType, setFundType] = useState('general_fund');
  const [narration, setNarration] = useState('');
  const [voucherLines, setVoucherLines] = useState([
    { accountId: accounts[0]?.id || '', debit: 5000, credit: 0, memo: '' },
    { accountId: accounts[1]?.id || '', debit: 0, credit: 5000, memo: '' },
  ]);

  // Fee Collection State
  const [feeStudentId, setFeeStudentId] = useState(students[0]?.id || '');
  const [feeAmount, setFeeAmount] = useState(1500);
  const [feeNotes, setFeeNotes] = useState('মাসিক খোরাকি ও টিউশন ফি');

  const filteredAccounts = accounts.filter((a) => a.fund_type === fundType);

  const totalDebit = voucherLines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
  const totalCredit = voucherLines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleInitAccounts = async () => {
    setIsPending(true);
    const res = await initializeDefaultChartOfAccounts();
    setIsPending(false);
    if (!res.success) {
      alert(res.error || 'ইনিশিয়ালাইজেশন ব্যর্থ।');
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError('জাবেদা ভাউচারের মোট ডেবিট ও মোট ক্রেডিট অবশ্যই সমান হতে হবে।');
      return;
    }
    setIsPending(true);
    setError(null);

    const res = await createJournalVoucher({
      entryDate,
      fundType: fundType as any,
      narration,
      lines: voucherLines.map((l) => ({
        accountId: l.accountId,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        memo: l.memo,
      })),
    });

    setIsPending(false);
    if (res.success) {
      setModalType('none');
      setNarration('');
    } else {
      setError(res.error || 'ভাউচার সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    // Default fee category placeholder
    const res = await collectFeePayment({
      studentId: feeStudentId,
      feeCategoryId: accounts[0]?.id || '',
      amount: Number(feeAmount),
      notes: feeNotes,
    });

    setIsPending(false);
    if (res.success) {
      alert(`ফি আদায় সফল! রশিদ নং: ${res.invoiceNumber}`);
      setModalType('none');
    } else {
      setError(res.error || 'ফি আদায় প্রক্রিয়া ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>সাধারণ প্রাতিষ্ঠানিক তহবিল</span>
            <Landmark className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">তহবিল নং ১</div>
          <p className="text-xs text-slate-400 mt-1">টিউশন ফি, বেতন ও সাধারণ ব্যয়</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>লিল্লাহ বোর্ডিং ও যাকাত তহবিল</span>
            <HeartHandshake className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-900">তহবিল নং ২</div>
          <p className="text-xs text-purple-700 mt-1">শরীয়াহ মোতাবেক সম্পূর্ণ পৃথক লেজার (Doc 26)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>মোট অনুমোদিত হিসাব খাত (Accounts)</span>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{accounts.length} টি খাত</div>
          <p className="text-xs text-slate-400 mt-1">দ্বি-তরফা খতিয়ান মানচিত্র</p>
        </div>
      </div>

      {/* Action Buttons & Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'vouchers'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            জাবেদা ভাউচার খাতা ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'accounts'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            চার্ট অব অ্যাকাউন্টস ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'invoices'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ফি আদায় ও রশিদ ({invoices.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {accounts.length === 0 && (
            <button
              onClick={handleInitAccounts}
              disabled={isPending}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
            >
              ইনিশিয়ালাইজ চার্ট অব একাউন্টস
            </button>
          )}

          <button
            onClick={() => setModalType('collect_fee')}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Receipt className="h-3.5 w-3.5" />
            + ফি গ্রহণ (Cash Counter)
          </button>

          <button
            onClick={() => setModalType('voucher')}
            disabled={accounts.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
          >
            <Plus className="h-4 w-4" />
            + জাবেদা ভাউচার (JV)
          </button>
        </div>
      </div>

      {/* Tab 1: Journal Entries */}
      {activeTab === 'vouchers' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {entries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              এখনো কোনো জাবেদা ভাউচার পোস্ট করা হয়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ভাউচার নং</th>
                    <th className="px-4 py-3">তারিখ</th>
                    <th className="px-4 py-3">তহবিল টাইপ</th>
                    <th className="px-4 py-3">বিবরণ / Narration</th>
                    <th className="px-4 py-3">ডেবিট / ক্রেডিট রেখা</th>
                    <th className="px-4 py-3 text-right">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {entries.map((je) => {
                    const lines = je.journal_entry_lines || [];
                    const amount = lines.reduce((acc: number, l: any) => acc + (Number(l.debit) || 0), 0);
                    return (
                      <tr key={je.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {je.entry_number}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {je.entry_date}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            je.fund_type === 'lillah_zakat_fund'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {je.fund_type === 'lillah_zakat_fund' ? 'লিল্লাহ যাকাত ফান্ড' : 'সাধারণ প্রাতিষ্ঠানিক ফান্ড'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 max-w-xs truncate">
                          {je.narration}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          ৳ {amount.toLocaleString('bn-BD')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            পোস্টেড
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
      )}

      {/* Tab 2: Chart of Accounts */}
      {activeTab === 'accounts' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">হিসাব কোড</th>
                  <th className="px-4 py-3">হিসাবের নাম (বাংলা)</th>
                  <th className="px-4 py-3">Name in English</th>
                  <th className="px-4 py-3">শ্রেণি (Category)</th>
                  <th className="px-4 py-3 text-right">তহবিল শ্রেণি (Fund)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{acc.code}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{acc.name_bn}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">{acc.name_en}</td>
                    <td className="px-4 py-2.5 uppercase text-slate-600 font-mono text-[11px]">{acc.category}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-700">{acc.fund_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Invoices */}
      {activeTab === 'invoices' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">রশিদ নং</th>
                  <th className="px-4 py-3">শিক্ষার্থীর নাম</th>
                  <th className="px-4 py-3">খাত</th>
                  <th className="px-4 py-3">পরিমাণ</th>
                  <th className="px-4 py-3 text-right">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((inv) => {
                  const st = inv.students as any;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{st?.full_name_bn}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{st?.admission_no}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">মাসিক বেতন ও ফি</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">৳ {inv.amount}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Journal Voucher Modal */}
      {modalType === 'voucher' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-left border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Landmark className="h-4 w-4 text-emerald-700" />
                নতুন জাবেদা ভাউচার (Double-Entry Journal Voucher)
              </h3>
              <button onClick={() => setModalType('none')} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateVoucher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ভাউচার তারিখ</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">তহবিল শ্রেণি (Fund Type)</label>
                  <select
                    value={fundType}
                    onChange={(e) => setFundType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                  >
                    <option value="general_fund">সাধারণ প্রাতিষ্ঠানিক ফান্ড</option>
                    <option value="lillah_zakat_fund">লিল্লাহ বোর্ডিং ও যাকাত ফান্ড</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিবরণ / Narration *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আসতিযা মাসিক বেতন বিতরণ বাবদ সোনালী ব্যাংক হতে উত্তোলন"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              {/* Debit Line */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block">১. ডেবিট হিসাব খাত (Debit Account)</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={voucherLines[0].accountId}
                    onChange={(e) => {
                      const copy = [...voucherLines];
                      copy[0].accountId = e.target.value;
                      setVoucherLines(copy);
                    }}
                    className="rounded-lg border border-slate-300 p-2 bg-white"
                  >
                    {filteredAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name_bn}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={voucherLines[0].debit}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const copy = [...voucherLines];
                      copy[0].debit = val;
                      copy[1].credit = val; // auto-balance
                      setVoucherLines(copy);
                    }}
                    className="rounded-lg border border-slate-300 p-2 font-mono bg-white font-bold text-emerald-800"
                    placeholder="ডেবিট টাকা"
                  />
                </div>
              </div>

              {/* Credit Line */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block">২. ক্রেডিট হিসাব খাত (Credit Account)</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={voucherLines[1].accountId}
                    onChange={(e) => {
                      const copy = [...voucherLines];
                      copy[1].accountId = e.target.value;
                      setVoucherLines(copy);
                    }}
                    className="rounded-lg border border-slate-300 p-2 bg-white"
                  >
                    {filteredAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name_bn}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={voucherLines[1].credit}
                    onChange={(e) => {
                      const copy = [...voucherLines];
                      copy[1].credit = Number(e.target.value);
                      setVoucherLines(copy);
                    }}
                    className="rounded-lg border border-slate-300 p-2 font-mono bg-white font-bold text-slate-800"
                    placeholder="ক্রেডিট টাকা"
                  />
                </div>
              </div>

              {/* Balance Verification Pill */}
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-100 font-mono">
                <span>মোট ডেবিট: ৳{totalDebit}</span>
                <span>মোট ক্রেডিট: ৳{totalCredit}</span>
                <span className={`font-bold ${isBalanced ? 'text-emerald-700' : 'text-red-600'}`}>
                  {isBalanced ? '✓ সমতুল্য (Balanced)' : '✗ অসমতুল্য!'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType('none')}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending || !isBalanced}
                  className="rounded-lg bg-emerald-700 text-white px-5 py-1.5 font-bold hover:bg-emerald-800 disabled:opacity-50"
                >
                  {isPending ? 'পোস্ট হচ্ছে...' : 'ভাউচার পোস্ট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Payment Collection Modal */}
      {modalType === 'collect_fee' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-700" />
                ক্যাশ কাউন্টার ফি আদায় (Cash Counter Receipt)
              </h3>
              <button onClick={() => setModalType('none')} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCollectFee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">শিক্ষার্থী নির্বাচন *</label>
                <select
                  value={feeStudentId}
                  onChange={(e) => setFeeStudentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name_bn} ({st.admission_no})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">আদায়কৃত টাকার পরিমাণ *</label>
                <input
                  type="number"
                  required
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">রশিদ নোট / মাস বিবরণ</label>
                <input
                  type="text"
                  value={feeNotes}
                  onChange={(e) => setFeeNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType('none')}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-emerald-700 text-white px-5 py-1.5 font-bold hover:bg-emerald-800 disabled:opacity-50"
                >
                  {isPending ? 'আদায় হচ্ছে...' : 'রশিদ তৈরি ও ফি গ্রহণ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
