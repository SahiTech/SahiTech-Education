import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  ShieldCheck,
  Layers,
  Languages,
  Building2,
  Award,
  ArrowRight,
  GraduationCap,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  Lock,
  Compass
} from 'lucide-react';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

  export default async function HomePage() {
    const dict = await getServerDictionary();
    const locale = await getServerLocale();
    const direction = await getServerDirection();

    return (
              <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-700 selection:text-white">
                {/* Hero Section with Islamic Architectural Backdrop */}
                <section className="relative overflow-hidden bg-slate-950 text-white min-h-[580px] sm:min-h-[640px] flex items-center">
                  {/* Background Campus Image with Gradient Overlays */}
                  <div className="absolute inset-0 z-0 opacity-35 mix-blend-luminosity filter brightness-90">
                    <Image
                      src="/images/hero-campus.jpg"
                      alt="Islamic Campus Architecture"
                      fill
                      priority
                      sizes="100vw"
                      className="object-cover object-center scale-105 transform duration-1000 ease-out"
                    />
                  </div>

                  {/* Arabesque geometric texture overlay */}
                  <div
                    className="absolute inset-0 z-1 opacity-20 bg-repeat pointer-events-none"
                    style={{ backgroundImage: "url('/images/islamic-pattern.jpg')", backgroundSize: '320px 320px' }}
                  />

                  {/* Deep emerald-to-slate gradient mask */}
                  <div className="absolute inset-0 z-2 bg-gradient-to-b from-emerald-950/80 via-slate-950/85 to-slate-950" />

                  {/* Content Container */}
                  <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 text-center">
                    {/* Institutional Tag Pill */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-4 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md mb-6 shadow-inner">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{dict.home.heroTag}</span>
                    </div>

                      {/* Hero Headings */}
                      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-snug">
                        {dict.home.heroTitle} <br className="hidden sm:inline" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-200 to-emerald-300">
                          {dict.home.heroTitleHighlight}
                        </span>
                      </h1>

                        <p className="mt-6 text-sm sm:text-base lg:text-lg text-emerald-100/85 max-w-3xl mx-auto font-normal leading-relaxed">
                          {dict.home.heroSubtitle}
                        </p>

                          {/* Action CTAs with accessible touch targets */}
                          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md sm:max-w-none mx-auto">
                            <Link
                              href="/dashboard"
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/50 hover:from-emerald-500 hover:to-emerald-600 transition min-h-[48px]"
                            >
                              <span>{dict.home.exploreDashboard}</span>
                              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                            </Link>

                            <Link
                              href="/verify"
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition min-h-[48px]"
                            >
                              <ShieldCheck className="h-4 w-4 text-emerald-300" />
                              <span>{dict.home.verifySanadCta}</span>
                            </Link>

                            <Link
                              href="/public-site"
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition min-h-[48px]"
                            >
                              <Building2 className="h-4 w-4 text-amber-300" />
                              <span>{dict.home.publicSiteCta}</span>
                            </Link>
                          </div>

                          {/* Trust Guarantees */}
                          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono text-2xl font-black text-emerald-400">100%</span>
                              <span className="text-xs text-slate-300 mt-1">RLS Data Isolation</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="font-mono text-2xl font-black text-amber-300">32</span>
                              <span className="text-xs text-slate-300 mt-1">Postgres 17 Tables</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="font-mono text-2xl font-black text-emerald-400">3</span>
                              <span className="text-xs text-slate-300 mt-1">বাংলা · English · العربية</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="font-mono text-2xl font-black text-amber-300">14</span>
                              <span className="text-xs text-slate-300 mt-1">Academic Modules</span>
                            </div>
                          </div>
                        </div>
                      </section>

                            {/* Feature Highlights Section */}
                            <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                              <div className="text-center mb-12 sm:mb-16">
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3 border border-emerald-200">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span>MDI Core Architecture</span>
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                  {dict.home.featuresTitle}
                                </h2>
                                  <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                                    {dict.home.featuresSubtitle}
                                  </p>
                              </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                      {/* Card 1: Qawmi */}
                                      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition duration-300" />
                                        <div className="relative z-10">
                                          <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-5 shadow-sm">
                                            <BookOpen className="h-6 w-6" />
                                          </div>
                                          <h3 className="text-xl font-bold text-slate-900">{dict.home.qawmiTitle}</h3>
                                          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                                            {dict.home.qawmiDesc}
                                          </p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
                                          <span className="inline-flex items-center text-xs font-semibold text-amber-800">
                                            দরসে নেজামী কাঠামো
                                          </span>
                                        </div>
                                      </div>

                                          {/* Card 2: Alia */}
                                          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition duration-300" />
                                            <div className="relative z-10">
                                              <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-5 shadow-sm">
                                                <GraduationCap className="h-6 w-6" />
                                              </div>
                                              <h3 className="text-xl font-bold text-slate-900">{dict.home.aliaTitle}</h3>
                                              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                                                {dict.home.aliaDesc}
                                              </p>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
                                              <span className="inline-flex items-center text-xs font-semibold text-blue-800">
                                                BMEB বোর্ড মানদণ্ড
                                              </span>
                                            </div>
                                          </div>

                                              {/* Card 3: Multi-Tenancy */}
                                              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition duration-300" />
                                                <div className="relative z-10">
                                                  <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5 shadow-sm">
                                                    <ShieldCheck className="h-6 w-6" />
                                                  </div>
                                                  <h3 className="text-xl font-bold text-slate-900">{dict.home.securityTitle}</h3>
                                                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                                                    {dict.home.securityDesc}
                                                  </p>
                                                </div>
                                                <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
                                                  <span className="inline-flex items-center text-xs font-semibold text-emerald-800">
                                                    Zero-Trust RLS Security
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Secondary Capabilities Strip */}
                                            <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="flex items-start gap-4">
                                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                                    <HeartHandshake className="h-5 w-5" />
                                                  </div>
                                                  <div>
                                                    <h4 className="text-base font-bold text-slate-900">লিল্লাহ ও যাকাত ফান্ড গভর্নেন্স</h4>
                                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                                      ডকুমেন্ট ২৬ শরীয়াহ মূলনীতি অনুযায়ী সাধারণ অনুদান ও যাকাত তহবিলের সম্পূর্ণ ব্যাংক অ্যাকাউন্ট ভিত্তিক পৃথকীকরণ।
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                                    <Award className="h-5 w-5" />
                                                  </div>
                                                  <div>
                                                    <h4 className="text-base font-bold text-slate-900">ক্রিপ্টোগ্রাফিক সনদপত্র</h4>
                                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                                      ডিজিটালভাবে স্বাক্ষরিত ও কিউআর কোড সম্বলিত সনদ যাচাই সুবিধা, যা বিশ্বের যে কোনো প্রান্ত থেকে তাৎক্ষণিক যাচাইযোগ্য।
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                                    <Building2 className="h-5 w-5" />
                                                  </div>
                                                  <div>
                                                    <h4 className="text-base font-bold text-slate-900">প্রতিষ্ঠানের নিজস্ব ওয়েবসাইট</h4>
                                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                                      প্রতিটি মাদরাসার জন্য তাৎক্ষণিক নোটিশ বোর্ড, ফলাফল ও পরিচিতি সম্বলিত আধুনিক পাবলিক ওয়েব পোর্টাল।
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </section>

                                          {/* Footer Strip */}
                                          <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
                                            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                                              <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">SahiTech Education</span>
                                                <span>·</span>
                                                <span>Madrasa Digitalization Initiative (MDI)</span>
                                              </div>
                                              <div className="flex items-center gap-4 text-slate-400">
                                                <span>Bangla · English · Arabic</span>
                                                <span>·</span>
                                                <span>PostgreSQL 17 RLS</span>
                                              </div>
                                            </div>
                                          </footer>
                                        </div>
                                        );
}
