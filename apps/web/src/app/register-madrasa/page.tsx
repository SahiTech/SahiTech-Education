import React, { Suspense } from 'react';
import { Building2 } from 'lucide-react';
import { RegisterForm } from './register-form';
import Link from 'next/link';

export default function RegisterMadrasaPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold shadow-sm mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            নতুন মাদরাসা প্রোভিশনিং ও নিবন্ধন
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            মাদরাসা ডিজিটাল অপারেটিং সিস্টেমে আপনার প্রতিষ্ঠানের ক্লাউড টেন্যান্ট তৈরি করুন
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-8 text-xs text-slate-400">ফর্ম লোড হচ্ছে...</div>}>
          <RegisterForm />
        </Suspense>

        <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          ইতিপূর্বে নিবন্ধিত প্রতিষ্ঠান?{' '}
          <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-900 underline">
            পোর্টালে লগইন করুন
          </Link>
        </div>
      </div>
    </div>
  );
}
