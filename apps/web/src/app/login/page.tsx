import React from 'react';
import Link from 'next/link';
import { BookOpen, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold shadow-sm mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            মাদরাসা পোর্টালে লগইন করুন
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            মুহতামিম, নাযেমে তালিমাত, আসতিযা ও স্টাফ লগইন
          </p>
        </div>

        <form className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ইমেইল বা ইউজারনেম (Email / Username)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="admin@madrasa.edu.bd"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
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
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-300 text-emerald-600" />
              মনে রাখুন
            </label>
            <a href="#" className="font-semibold text-emerald-700 hover:text-emerald-900">
              পাসওয়ার্ড ভুলে গেছেন?
            </a>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-800 transition"
          >
            প্রবেশ করুন (Sign In)
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
          SahiTech Education · Protected by Supabase Auth & PostgreSQL RLS
        </div>
      </div>
    </div>
  );
}

