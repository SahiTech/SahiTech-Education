import React from 'react';
import { Building2, BookOpen, ShieldCheck, Sparkles, CheckCircle2, HeartHandshake, PhoneCall } from 'lucide-react';
import { RegisterForm } from './register-form';
import Link from 'next/link';

export const metadata = {
  title: 'মাদরাসা নিবন্ধনের ডিজিটাল আবেদন | SahiTech MDI',
  description: 'দেশি ও বিদেশি কওমি, আলিয়া ও দ্বীনি শিক্ষা প্রতিষ্ঠানের জন্য MDI ডিজিটাল অন্তর্ভুক্তি ও নিবন্ধন পোর্টাল।',
};

export default function RegisterMadrasaPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Islamic Geometry & Emerald Glow */}
      <div
        className="absolute inset-0 z-0 opacity-15 bg-repeat pointer-events-none"
        style={{ backgroundImage: "url('/images/islamic-pattern.jpg')", backgroundSize: '300px 300px' }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-600/20 via-emerald-800/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        {/* Sacred Header with Bismillah */}
        <div className="text-center space-y-3">
          <p className="font-serif text-lg sm:text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-200 to-emerald-300">
            بِسْمِ اللهِ الرَّחْمٰنِ الرَّחِيْمِ
          </p>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-4 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>মাদরাসা ডিজিটালাইজেশন ইনিশিয়েটিভ (MDI) · প্রাতিষ্ঠানিক অন্তর্ভুক্তি</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight sm:leading-snug">
            মাদরাসা নিবন্ধন ও ডিজিটাল অন্তর্ভুক্তি আবেদন
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-emerald-100/80 max-w-3xl mx-auto leading-relaxed">
            দেশি ও বিদেশি কওমি, আলিয়া, হিফজুল কুরআন ও সমন্বিত দ্বীনি শিক্ষা প্রতিষ্ঠানের জন্য তৈরি আন্তর্জাতিক মানের উন্মুক্ত ডিজিটাল অপারেটিং সিস্টেম। শিক্ষক ও ম্যানেজমেন্ট টিম সহজে ৪টি ধাপে আবেদন সম্পন্ন করতে পারবেন।
          </p>

          {/* Quick Assurance Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> ১০০% সুরক্ষিত ও এনক্রিপ্টেড
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
              <BookOpen className="h-4 w-4 text-amber-400" /> বেফাক, হাইআ ও BMEB উপযোগী
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
              <HeartHandshake className="h-4 w-4 text-emerald-400" /> সম্পূর্ণ বিনামূল্যে কারিগরি সহায়তা
            </span>
          </div>
        </div>

        {/* Wizard Form Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 sm:p-8 lg:p-10 shadow-2xl text-slate-900">
          <RegisterForm />
        </div>

        {/* Footer Support & Navigation */}
        <div className="text-center space-y-3 pt-2 text-xs text-slate-400">
          <p>
            ইতিমধ্যে আপনার প্রতিষ্ঠানের অ্যাকাউন্ট অনুমোদিত রয়েছে?{' '}
            <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300 underline transition">
              মাদরাসা পোর্টালে সরাসরি লগইন করুন
            </Link>
          </p>
          <p className="text-slate-500">
            জরুরি পরামর্শ বা কোনো প্রশ্নের জন্য আমাদের গ্লোবাল হেল্পলাইন:{' '}
            <span className="text-emerald-400 font-mono font-semibold">helpline.sahitech@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
