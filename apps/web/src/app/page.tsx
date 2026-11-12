import React from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  ShieldCheck, 
  Layers, 
  Languages, 
  Building2, 
  Award, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SahiTech Education · Madrasa Digitalization Initiative (MDI)
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            কওমি ও আলিয়া মাদরাসার <br className="hidden sm:inline" />
            <span className="text-emerald-400">আধুনিক পূর্ণাঙ্গ ডিজিটাল অপারেটিং সিস্টেম</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-emerald-100/90 max-w-3xl mx-auto font-normal">
            দাওরায়ে হাদীস, ইফতা, হিফজুল কুরআন থেকে শুরু করে আলিয়া মাদরাসা বোর্ডের সকল স্তরের শিক্ষার্থী, পাঠ্যসূচি, 
            হাজিরা, পরীক্ষা ও লিল্লাহ ফান্ডের নিরাপদ হাইব্রিড মাল্টি-টেন্যান্ট প্ল্যাটফর্ম।
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-emerald-400 transition"
            >
              সরাসরি ড্যাশবোর্ড দেখুন
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/academic"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/10 transition"
            >
              একাডেমিক ইঞ্জিন বিস্তারিত
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            মাদরাসা ব্যবস্থাপনার বিশেষায়িত ফিচারসমূহ
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            ঐতিহ্যবাহী দরসে নেজামী ও আধুনিক শিক্ষা বোর্ডের পূর্ণাঙ্গ সমন্বয়
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">কওমি দরসে নেজামী ইঞ্জিন</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              ইবতিদায়িয়্যাহ থেকে দাওরায়ে হাদীস ও ইফতা পর্যন্ত মারহালা বিন্যাস, কিতাব বণ্টন, ছালা টার্ম পরীক্ষা ও সনদ ব্যবস্থাপনা।
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">আলিয়া মাদ্রাসা বোর্ড ইঞ্জিন</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              ইবতেদায়ি, দাখিল, আলিম ও কামিল স্তরের বিএমইবি (BMEB) কারিকুলাম, জিপিএ গ্রেডিং এবং বোর্ড রেজিস্ট্রেশন ট্র্যাকিং।
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">নিরাপদ হাইব্রিড মাল্টি-টেন্যান্সি</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              পোস্টগ্রেস আরএলএস (Row Level Security) দ্বারা প্রতিটি মাদরাসার উপাত্ত সম্পূর্ণ বিচ্ছিন্ন ও নিরাপদ।
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

