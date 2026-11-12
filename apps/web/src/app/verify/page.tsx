'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Search, Award, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SanadVerificationLookupPage() {
  const [token, setToken] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      router.push(`/verify/${encodeURIComponent(token.trim().toUpperCase())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ডিজিটাল সনদ অনলাইন যাচাইকরণ
          </h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-400 font-bold">
            Public Sanad Verification Portal
          </p>
          <p className="mt-2 text-sm text-slate-600">
            যেকোনো কওমি বা আলিয়া মাদরাসার ইস্যুকৃত ডিজিটাল সনদের সত্যতা ও গ্রেড যাচাই করতে সনদের ইউনিক কোড প্রদান করুন।
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                ভেরিফিকেশন টোকেন বা সিকিউরিটি হ্যাশ
              </label>
              <div className="relative mt-2">
                <input
                  id="token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="যেমন: SANAD-XXXXX বা 64-বিট হ্যাশ"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-mono uppercase tracking-wide focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                সনদের নিচের ডান কোণায় মুদ্রিত ভেরিফিকেশন কোড লিখুন।
              </p>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 py-2.5 px-4 text-sm font-semibold text-white shadow hover:bg-emerald-800 transition"
            >
              <Search className="h-4 w-4" />
              সনদ যাচাই করুন
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>ক্রিপ্টোগ্রাফিক ডিজিটাল সিগনেচার ও টেম্পার-প্রুফ যাচাই</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>কওমি বেফাকুল মাদারিস ও আলিয়া সমমান পাঠ্যক্রমের প্রামাণ্য ফল</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>নিয়োগদাতা প্রতিষ্ঠান ও উচ্চশিক্ষার জন্য সরাসরি সত্যতা প্রমাণ</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-emerald-700 underline font-medium">
            প্রধান পাতায় ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}

