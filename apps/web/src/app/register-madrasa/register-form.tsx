'use client';

import React, { useActionState } from 'react';
import { provisionInstitution } from '@/app/actions/provisioning';
import { Building2, Globe, Shield, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(provisionInstitution, { success: false });

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            মাদরাসার নাম (Madrasa Official Name) *
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="যেমন: জামিয়া ইসলামিয়া দারুল উলুম"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            প্রাতিষ্ঠানিক কোড (Code - ইউনিক) *
          </label>
          <input
            name="code"
            type="text"
            required
            placeholder="যেমন: JIDU-01"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase focus:border-emerald-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            পছন্দের সাবডোমেইন (Subdomain) *
          </label>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-emerald-600">
            <input
              name="subdomain"
              type="text"
              required
              placeholder="darululoom"
              className="flex-1 px-3 py-2 text-sm lowercase focus:outline-none"
            />
            <span className="bg-slate-100 px-2.5 py-2 text-xs text-slate-500 border-l border-slate-300 flex items-center">
              .sahitech-edu.com
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            কারিকুলাম ধরন (Academic Curriculum) *
          </label>
          <select
            name="curriculumType"
            defaultValue="qawmi"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none bg-white"
          >
            <option value="qawmi">কওমি দরসে নেজামী (Dars-e-Nizami / Befaq)</option>
            <option value="alia">আলিয়া মাদ্রাসা বোর্ড (BMEB Framework)</option>
            <option value="hybrid">সমন্বিত (উভয় কারিকুলাম পরিচালিত)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            প্রাতিষ্ঠানিক ইমেইল (Official Email) *
          </label>
          <input
            name="contactEmail"
            type="email"
            required
            placeholder="office@madrasa.edu.bd"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            অফিসিয়াল মোবাইল নং (Phone Number) *
          </label>
          <input
            name="contactPhone"
            type="text"
            required
            placeholder="01711-000000"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            জেলা (District)
          </label>
          <input
            name="district"
            type="text"
            placeholder="যেমন: ঢাকা / চট্টগ্রাম / সিলেট"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            ক্যাম্পাসের ঠিকানা (Campus Address)
          </label>
          <input
            name="address"
            type="text"
            placeholder="রোড, পোস্ট অফিস, থানা"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-3 text-xs text-emerald-800">
        <p className="font-semibold mb-1">স্বয়ংক্রিয় প্রাতিষ্ঠানিক সেটআপ:</p>
        <p>নিবন্ধন সম্পন্ন হলে প্রধান ক্যাম্পাস, চলতি শিক্ষাবর্ষ এবং নির্বাচিত কারিকুলামের ডিফল্ট বিভাগসমূহ তাৎক্ষণিকভাবে তৈরি হয়ে যাবে।</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-60 transition mt-4"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            মাদরাসা তৈরি ও প্রোভিশনিং হচ্ছে...
          </>
        ) : (
          <>
            মাদরাসা প্রোভিশনিং সম্পন্ন করুন (Complete Provisioning)
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}

