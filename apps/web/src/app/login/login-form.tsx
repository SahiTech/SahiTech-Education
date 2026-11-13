'use client';

import React, { useActionState } from 'react';
import { signInWithEmail, AuthActionResult } from '@/app/actions/auth';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const initialAuthState: AuthActionResult = { success: false, error: '' };

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const [state, formAction, isPending] = useActionState(signInWithEmail, initialAuthState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          ইমেইল এড্রেস (Email Address)
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="muhtamim@madrasa.edu.bd"
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          পাসওয়ার্ড (Password)
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
          <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
          মনে রাখুন (Remember)
        </label>
        <a href="/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-900">
          পাসওয়ার্ড ভুলে গেছেন?
        </a>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-60 transition"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            যাচাই করা হচ্ছে...
          </>
        ) : (
          <>
            প্রবেশ করুন (Sign In)
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}

