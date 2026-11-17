'use client';

import React, { useActionState } from 'react';
import { completeInitialPasswordChange, type InitialPasswordChangeState } from '@/app/actions/auth';
import { KeyRound, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const initialState: InitialPasswordChangeState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(completeInitialPasswordChange, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-bold text-slate-700">নতুন Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-xs font-bold text-slate-700">নতুন Password আবার লিখুন</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <p className="text-[11px] leading-5 text-slate-500">
        কমপক্ষে ১২ অক্ষর ব্যবহার করুন; বড় হাতের অক্ষর, ছোট হাতের অক্ষর ও সংখ্যা রাখুন। আগের Temporary Password পুনরায় ব্যবহার করবেন না।
      </p>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" />Password নিরাপদ করা হচ্ছে…</> : 'নতুন Password সংরক্ষণ করুন'}
      </button>
    </form>
  );
}
