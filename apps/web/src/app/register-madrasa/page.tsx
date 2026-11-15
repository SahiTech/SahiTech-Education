import React from 'react';
import {
  Building2,
  BookOpen,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  HeartHandshake,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Lock,
  Globe,
  Clock,
  ArrowRight
} from 'lucide-react';
import { RegisterForm } from './register-form';
import Link from 'next/link';

export const metadata = {
  title: 'মাদরাসা নিবন্ধনের ডিজিটাল আবেদন | SahiTech MDI',
  description: 'দেশি ও বিদেশি কওমি, আলিয়া ও দ্বীনি শিক্ষা প্রতিষ্ঠানের জন্য MDI ডিজিটাল অন্তর্ভুক্তি ও নিবন্ধন পোর্টাল।',
};

const SUPPORT_PHONE = '+8801601654316';
const SUPPORT_EMAIL = 'sahitecheducation@gmail.com';

export default function RegisterMadrasaPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col justify-between">
      {/* Background Decorative Islamic Geometry & Emerald Glow */}
      <div
        className="absolute inset-0 z-0 opacity-15 bg-repeat pointer-events-none"
        style={{ backgroundImage: "url('/images/islamic-pattern.jpg')", backgroundSize: '300px 300px' }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-600/20 via-emerald-800/10 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 flex-1 w-full">
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
            দেশি ও বিদেশি কওমি, আলিয়া, হিফজুল কুরআন ও সমন্বিত দ্বীনি শিক্ষা প্রতিষ্ঠানের জন্য তৈরি আন্তর্জাতিক মানের উন্মুক্ত ডিজিটাল অপারেটিং সিস্টেম। শিক্ষক ও পরিচালনা পর্ষদ সহজে ৩টি ধাপে আবেদন সম্পন্ন করতে পারবেন।
          </p>

          {/* Quick Assurance Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-800 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> ১০০% সুরক্ষিত ও এনক্রিপ্টেড
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-800 backdrop-blur">
              <BookOpen className="h-4 w-4 text-amber-400" /> বেফাক, হাইআ ও BMEB উপযোগী
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-800 backdrop-blur">
              <HeartHandshake className="h-4 w-4 text-emerald-400" /> সম্পূর্ণ বিনামূল্যে কারিগরি সহায়তা
            </span>
          </div>
        </div>

        {/* Wizard Form Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 sm:p-8 lg:p-10 shadow-2xl text-slate-100">
          <RegisterForm />
        </div>

        {/* Quick Portal Switch Notice */}
        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-4 text-center backdrop-blur-sm">
          <p className="text-xs text-slate-300">
            ইতিমধ্যে আপনার প্রতিষ্ঠানের অ্যাকাউন্ট নিবন্ধিত ও অনুমোদিত?{' '}
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 underline decoration-amber-400/50 underline-offset-4 transition ml-1"
            >
              <span>মাদরাসা এডমিন পোর্টালে লগইন করুন</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      </div>

      {/* Advanced Institutional Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Column 1: Institutional Brand & Mission */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-900/30 font-serif font-black text-lg">
                  ص
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">SahiTech Education</h3>
                  <p className="text-[11px] font-semibold text-emerald-400">Madrasa Digitalization Initiative (MDI)</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ঐতিহ্যবাহী কওমি ও আলিয়া মাদরাসার স্বকীয়তা অক্ষুণ্ণ রেখে আধুনিক প্রযুক্তি, নিরাপদ ডাটাবেজ ও ক্লাউড অপারেটিং সিস্টেমের সমন্বয়ে তৈরি পূর্ণাঙ্গ শিক্ষা ও প্রশাসন সমাধান।
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 bg-emerald-950/60 border border-emerald-800/40 rounded-lg px-3 py-1.5 w-fit">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ক্লাউড সিস্টেম সচল ও নিরাপদ</span>
              </div>
            </div>

            {/* Column 2: Official Support & Helpdesk */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>অফিসিয়াল হেল্পডেস্ক ও সহায়তা</span>
              </h4>
              <p className="text-xs text-slate-400">
                আবেদন প্রক্রিয়া, ডকুমেন্ট যাচাই কিংবা মাদরাসা অনবোর্ডিং সংক্রান্ত যেকোনো প্রয়োজনে সরাসরি যোগাযোগ করুন:
              </p>
              <div className="space-y-2.5 text-xs">
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="flex items-center gap-2 text-white hover:text-emerald-300 transition group font-medium"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 group-hover:border-emerald-500 transition">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span>{SUPPORT_PHONE}</span>
                </a>

                <a
                  href={`https://wa.me/${SUPPORT_PHONE.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white hover:text-emerald-300 transition group font-medium"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 group-hover:border-emerald-500 transition">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span>WhatsApp চ্যাট সাপোর্ট</span>
                </a>

                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex items-center gap-2 text-white hover:text-emerald-300 transition group font-medium"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 group-hover:border-emerald-500 transition">
                    <Mail className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <span className="font-mono text-[11px]">{SUPPORT_EMAIL}</span>
                </a>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>শনিবার – বৃহস্পতিবার (সকাল ৯টা – রাত ১০টা)</span>
                </div>
              </div>
            </div>

            {/* Column 3: Quick Navigation */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span>গুরুত্বপূর্ণ লিংক ও পোর্টাল</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/login" className="hover:text-emerald-300 transition flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                    <span>মাদরাসা এডমিন ও শিক্ষক লগইন</span>
                  </Link>
                </li>
                <li>
                  <Link href="/verify" className="hover:text-emerald-300 transition flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                    <span>ডিজিটাল সনদ ও প্রত্যয়নপত্র যাচাই</span>
                  </Link>
                </li>
                <li>
                  <Link href="/register-madrasa" className="hover:text-emerald-300 transition flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                    <span>নতুন প্রতিষ্ঠান নিবন্ধন ফরম</span>
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-emerald-300 transition flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                    <span>MDI মূল প্ল্যাটফর্ম পরিচিতি</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Security, RLS & Compliance */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>নিরাপত্তা ও শরিয়াহ নীতি</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>PostgreSQL 17 RLS আইসোলেশন</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    প্রতিটি মাদরাসার তথ্য কঠোর রো-লেভেল সিকিউরিটির মাধ্যমে সম্পূর্ণ সুরক্ষিত ও আলাদা থাকে।
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>লিল্লাহ ও সাধারণ তহবিল পৃথকীকরণ</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    শরিয়াহ সম্মত জাকাত ও লিল্লাহ ফান্ড ব্যবস্থাপনায় স্বয়ংক্রিয় হিসাব অডিট সুবিধা।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © {currentYear} <span className="text-slate-300 font-semibold">SahiTech Education</span> · Madrasa Digitalization Initiative (MDI). সর্বস্বত্ব সংরক্ষিত।
            </p>
            <div className="flex items-center gap-6 text-[11px]">
              <span className="text-slate-500">গোপনীয়তা ও ডেটা সুরক্ষানীতি</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500">শর্তাবলী</span>
              <span className="text-slate-700">·</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                SSL 256-Bit Encrypted
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}