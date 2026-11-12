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
