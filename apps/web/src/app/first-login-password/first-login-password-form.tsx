'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Loader2 } from 'lucide-react';
import { changeInitialMadrasaAdminPassword, type AuthActionResult } from '@/app/actions/auth';

const initialState: AuthActionResult = { success: false, error: '' };

export default function FirstLoginPasswordForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(changeInitialMadrasaAdminPassword, initialState);

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [state.success, state.redirectTo, router]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="currentPassword" className="mb-1 block text-xs font-bold text-slate-700">Owner-এর দেওয়া Temporary Password</label>
        <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-bold text-slate-700">নতুন পাসওয়ার্ড</label>
        <input id="password" name="password" type="password" required minLength={12} autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-xs font-bold text-slate-700">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={12} autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
      </div>
      <button type="submit" disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
        {isPending ? 'নিরাপদে পাসওয়ার্ড সংরক্ষণ হচ্ছে...' : 'নতুন পাসওয়ার্ড সংরক্ষণ করুন'}
      </button>
    </form>
  );
}
