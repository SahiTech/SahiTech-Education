'useclient';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Globe, Shield, User } from 'lucide-react';

interface NavbarProps {
  currentLocale?: string;
  onLocaleChange?: (locale: string) => void;
}

export function Navbar({ currentLocale = 'bn', onLocaleChange }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                SahiTech <span className="text-emerald-700">MDI</span>
              </span>
              <span className="text-xs text-slate-500 font-medium block">
                Madrasa Digitalization Initiative
              </span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
          <Link href="/dashboard" className="hover:text-emerald-700 transition-colors">
            ড্যাশবোর্ড (Dashboard)
          </Link>
          <Link href="/dashboard/academic" className="hover:text-emerald-700 transition-colors">
            একাডেমিক ইঞ্জিন (Academic)
          </Link>
          <Link href="/dashboard/students" className="hover:text-emerald-700 transition-colors">
            শিক্ষার্থী ও ছাত্রাবাস (Students)
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-1 text-xs">
            <Globe className="h-3.5 w-3.5 text-slate-500 mr-1" />
            <span className="font-semibold px-1 text-emerald-800">বাংলা</span>
            <span className="text-slate-300">|</span>
            <span className="px-1 text-slate-500 hover:text-slate-800 cursor-pointer">EN</span>
            <span className="text-slate-300">|</span>
            <span className="px-1 text-slate-500 hover:text-slate-800 cursor-pointer">العربية</span>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
          >
            <User className="h-3.5 w-3.5" />
            লগইন (Sign In)
          </Link>
        </div>
      </div>
    </header>
  );
}

