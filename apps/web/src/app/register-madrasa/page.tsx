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
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Background Decorative Islamic Geometry & Emerald Glow (Optimized for Mobile GPU) */}
      <div
        className="absolute inset-0 z-0 opacity-10 bg-repeat pointer-events-none hidden sm:block"
        style={{ backgroundImage: "url('/images/islamic-pattern.jpg')", backgroundSize: '240px 240px' }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 sm:h-96 bg-gradient-to-b from-emerald-600/15 via-emerald-800/10 to-transparent blur-2xl sm:blur-3xl pointer-events-none" />

      {/* Main Container - Ultra Compact on Mobile */}
      <main className="relative z-10 py-5 sm:py-12 px-2.5 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-4 sm:space-y-7 flex-1 w-full">
        {/* Sacred Header with Bismillah */}
        <header className="text-center space-y-2 sm:space-y-3">
          <p className="font-serif text-base sm:text-2xl font-bold tracking-wider sm:tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-200 to-emerald-300">
            بِسْمِ اللهِ الرَّחْمٰنِ الرَّחِيْمِ
          </p>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-300 shadow-inner">
            <Sparkles className="h-3 w-3 text-amber-300 shrink-0" />
            <span className="truncate">মাদরাসা ডিজিটালাইজেশন ইনিশিয়েটিভ (MDI)</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug sm:leading-tight">
            মাদরাসা নিবন্ধন ও ডিজিটাল অন্তর্ভুক্তি আবেদন
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl mx-auto leading-relaxed px-1">
            কওমি, আলিয়া ও দ্বীনি শিক্ষা প্রতিষ্ঠানের জন্য তৈরি আন্তর্জাতিক মানের মুক্ত ডিজিটাল অপারেটিং সিস্টেম। ৩টি সহজ ধাপে আপনার মাদরাসার আবেদন সম্পন্ন করুন।
          </p>

          {/* Quick Assurance Strip - Mobile Horizontal Swipeable / Wrap */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>১০০% সুরক্ষিত ও এনক্রিপ্টেড</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-800">
              <BookOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>বেফাক, হাইআ ও BMEB উপযোগী</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-800">
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>সম্পূর্ণ বিনামূল্যে সহায়তা</span>
            </span>
          </div>
        </header>

        {/* Wizard Form Card - High contrast, touch-optimized */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/95 p-3.5 sm:p-7 lg:p-9 shadow-2xl text-slate-100">
          <RegisterForm />
        </section>

        {/* Quick Portal Switch Notice */}
        <div className="rounded-xl sm:rounded-2xl border border-emerald-900/40 bg-emerald-950/40 p-3 sm:p-4 text-center">
          <p className="text-xs text-slate-300">
            ইতিমধ্যে আপনার প্রতিষ্ঠানের অ্যাকাউন্ট নিবন্ধিত?{' '}
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 underline decoration-amber-400/50 underline-offset-4 transition ml-1"
            >
              <span>এডমিন পোর্টালে লগইন করুন</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </main>

      {/* Advanced Institutional Footer - Fast Render */}
      <footer
        className="relative z-10 border-t border-slate-800/80 bg-slate-950 text-slate-400 mt-8 sm:mt-12"
        style={{ contentVisibility: 'auto' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Quick Mobile Action Bar */}
          <div className="sm:hidden mb-8 rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2.5">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
              জরুরি কারিগরি সহায়তা হেল্পডেস্ক
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${SUPPORT_PHONE}`}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-950 border border-emerald-700/50 py-2.5 px-3 text-xs font-bold text-emerald-300 active:scale-95 transition"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>সরাসরি কল</span>
              </a>
              <a
                href={`https://wa.me/${SUPPORT_PHONE.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 px-3 text-xs font-bold text-white shadow-sm active:scale-95 transition"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 font-mono pt-1 text-center truncate"
            >
              <Mail className="h-3 w-3 text-amber-400 shrink-0" />
              <span>{SUPPORT_EMAIL}</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-8">
            {/* Column 1: Institutional Brand & Mission */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md font-serif font-black text-base">
                  ص
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight">SahiTech Education</h3>
                  <p className="text-[10px] font-semibold text-emerald-400">Madrasa Digitalization Initiative (MDI)</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ঐতিহ্যবাহী কওমি ও আলিয়া মাদরাসার স্বকীয়তা অক্ষুণ্ণ রেখে আধুনিক প্রযুক্তি, নিরাপদ ডাটাবেজ ও ক্লাউড অপারেটিং সিস্টেমের সমন্বয়ে তৈরি সমাধান।
              </p>
              <div className="flex items-center gap-2 text-[10px] text-emerald-300/80 bg-emerald-950/60 border border-emerald-800/40 rounded-lg px-2.5 py-1 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ক্লাউড সিস্টেম সক্রিয় ও নিরাপদ</span>
              </div>
            </div>

            {/* Column 2: Official Support & Helpdesk */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>অফিসিয়াল হেল্পডেস্ক</span>
              </h4>
              <p className="text-xs text-slate-400">
                আবেদন প্রক্রিয়া বা অনবোর্ডিং সংক্রান্ত যেকোনো প্রয়োজনে সরাসরি যোগাযোগ করুন:
              </p>
              <div className="space-y-2 text-xs">
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="flex items-center gap-2 text-white hover:text-emerald-300 transition group font-medium"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 border border-slate-700">
                    <Phone className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span>{SUPPORT_PHONE}</span>
                </a>

                <a
                  href={`https://wa.me/${SUPPORT_PHONE.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white hover:text-emerald-300 transition group font-medium"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 border border-slate-700">
                    <MessageCircle className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span>WhatsApp চ্যাট সাপোর্ট</span>
                </a>

                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex items-center gap-2 text-white hover:text-emerald-300 transition group font-medium"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 border border-slate-700">
                    <Mail className="h-3 w-3 text-amber-400" />
                  </div>
                  <span className="font-mono text-[11px] truncate">{SUPPORT_EMAIL}</span>
                </a>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>শনি – বৃহস্পতি (সকাল ৯টা – রাত ১০টা)</span>
                </div>
              </div>
            </div>

            {/* Column 3: Quick Navigation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span>গুরুত্বপূর্ণ লিংক</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/login" className="hover:text-emerald-300 transition flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                    <span>মাদরাসা এডমিন লগইন</span>
                  </Link>
                </li>
                <li>
                  <Link href="/verify" className="hover:text-emerald-300 transition flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                    <span>ডিজিটাল সনদ যাচাই</span>
                  </Link>
                </li>
                <li>
                  <Link href="/register-madrasa" className="hover:text-emerald-300 transition flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                    <span>নতুন প্রতিষ্ঠান নিবন্ধন</span>
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-emerald-300 transition flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                    <span>MDI মূল প্ল্যাটফর্ম</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Security, RLS & Compliance */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>নিরাপত্তা ও শরিয়াহ নীতি</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <span>PostgreSQL 17 RLS আইসোলেশন</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    প্রতিটি মাদরাসার তথ্য স্বাধীন রো-লেভেল সিকিউরিটিতে সম্পূর্ণ আলাদা।
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                    <CheckCircle2 className="h-3 w-3 text-amber-400" />
                    <span>লিল্লাহ ও সাধারণ তহবিল পৃথকীকরণ</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    শরিয়াহ সম্মত জাকাত ও লিল্লাহ ফান্ড অডিট সুবিধা।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p className="text-center sm:text-left">
              © {currentYear} <span className="text-slate-300 font-semibold">SahiTech Education</span> · MDI. সর্বস্বত্ব সংরক্ষিত।
            </p>
            <div className="flex items-center gap-3">
              <span>গোপনীয়তা নীতি</span>
              <span>·</span>
              <span>শর্তাবলী</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                SSL 256-Bit
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}