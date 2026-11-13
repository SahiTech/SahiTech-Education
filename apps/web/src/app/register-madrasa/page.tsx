import React from 'react';
import { Building2 } from 'lucide-react';
import { RegisterForm } from './register-form';
import Link from 'next/link';

export default function RegisterMadrasaPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white"><Building2 className="h-6 w-6" /></div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">MDI-তে মাদরাসা নিবন্ধনের আবেদন</h1>
          <p className="mt-2 text-sm text-slate-500">প্রতিষ্ঠানের তথ্য জমা দিন। যাচাই ও অনুমোদনের পর নিরাপদ invitation-এর মাধ্যমে account তৈরি হবে।</p>
        </div>
        <RegisterForm />
        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">ইতিমধ্যে account আছে? <Link href="/login" className="font-semibold text-emerald-700 underline">মাদরাসা পোর্টালে লগইন করুন</Link></div>
      </div>
    </div>
  );
}
