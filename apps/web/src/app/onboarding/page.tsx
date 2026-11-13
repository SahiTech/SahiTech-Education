import React from 'react';
import { getOnboardingState } from '@/app/actions/onboarding';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from './onboarding-wizard';
import { School, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const state = await getOnboardingState();

  if (!state || !state.context) {
    redirect('/register-madrasa');
  }

  if (state.tenant?.platform_status === 'pending_activation' && state.tenant?.onboarding_completed_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">অনবোর্ডিং সম্পন্ন হয়েছে</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            আপনার মাদরাসার প্রাথমিক সেটআপ সফলভাবে সম্পন্ন হয়েছে। এখন SahiTech Education Global Platform Owner-এর চূড়ান্ত যাচাই ও activation-এর অপেক্ষায় রয়েছে।
            অনুমোদনের আগে একাডেমিক, ভর্তি, উপস্থিতি ও আর্থিক কার্যক্রমের পোর্টাল বন্ধ থাকবে।
          </p>
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-left text-xs leading-6 text-slate-600">
            <p><b>প্রতিষ্ঠান:</b> {state.tenant?.name}</p>
            <p><b>কোড:</b> {state.tenant?.code}</p>
            <p><b>স্ট্যাটাস:</b> Pending final activation</p>
            <p><b>জমার তারিখ:</b> {new Date(state.tenant.onboarding_completed_at).toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <School className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  প্রতিষ্ঠান সেটআপ ও অনবোর্ডিং উইজার্ড (Institution Onboarding)
                </h1>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Phase 2
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {state.tenant?.name} · কোড: <span className="font-mono">{state.tenant?.code}</span> · কারিকুলাম: <span className="capitalize">{state.tenant?.curriculum_type}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              ড্যাশবোর্ডে ফিরে যান →
            </Link>
          </div>
        </div>

        {/* Wizard Component */}
        <OnboardingWizard initialState={state} />
      </div>
    </div>
  );
}

