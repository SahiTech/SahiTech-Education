'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Search, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function SanadVerificationLookupPage() {
  const [token, setToken] = useState('');
  const router = useRouter();
  const { t, locale, direction } = useI18n();

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
            {t.verify.pageTitle}
          </h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-400 font-bold">
            {t.verify.pageSubtitle}
          </p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {locale === 'ar'
                ? 'أدخل رمز التحقق الأمني المطبوع أسفل الشهادة الرسمية للتحقق من مصداقيتها ودرجتها العلمية.'
                : locale === 'en'
                  ? 'Enter the verification token or cryptographic hash to verify credential authenticity and honours.'
                  : 'যেকোনো কওমি বা আলিয়া মাদরাসার ইস্যুকৃত ডিজিটাল সনদের সত্যতা ও গ্রেড যাচাই করতে সনদের ইউনিক কোড প্রদান করুন।'}
            </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t.verify.enterToken}
              </label>
              <div className="relative mt-2">
                <input
                  id="token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t.verify.tokenPlaceholder}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-mono uppercase tracking-wide focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 min-h-[44px]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3 px-4 text-sm font-semibold text-white shadow hover:bg-emerald-800 transition min-h-[44px]"
            >
              <Search className="h-4 w-4" />
              <span>{t.verify.verifyBtn}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{locale === 'ar' ? 'توقيعات رقمية مشفرة وغير قابلة للتزوير' : locale === 'en' ? 'Cryptographic digital signature and tamper-proof validation' : 'ক্রিপ্টোগ্রাফিক ডিজিটাল সিগনেচার ও টেম্পার-প্রুফ যাচাই'}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{locale === 'ar' ? 'نتائج معتمدة من وفاق المدارس ومجالس التعليم' : locale === 'en' ? 'Official Befaqul Madaris and Board compliant curriculum outcomes' : 'কওমি বেফাকুল মাদারিস ও আলিয়া সমমান পাঠ্যক্রমের প্রামাণ্য ফল'}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{locale === 'ar' ? 'تحقق فوري لأرباب العمل والجامعات الدولية' : locale === 'en' ? 'Direct verification for employers and higher education institutions' : 'নিয়োগদাতা প্রতিষ্ঠান ও উচ্চশিক্ষার জন্য সরাসরি সত্যতা প্রমাণ'}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-emerald-700 underline font-medium">
            {t.common.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
