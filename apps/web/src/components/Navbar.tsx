'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Locale } from '@/lib/i18n/types';
import { BookOpen, Globe, User, PlusCircle, Menu, X, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  user?: { email?: string } | null;
}

  export function Navbar({ user }: NavbarProps) {
    const { locale, setLocale, t, direction } = useI18n();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: Locale) => {
      setLocale(newLocale);
    };

    const navLinks = [
      { name: t.nav.overview, href: '/dashboard' },
      { name: t.nav.academic, href: '/dashboard/academic' },
      { name: t.nav.students, href: '/dashboard/students' },
      { name: t.nav.publicSite, href: '/public-site' },
      { name: t.nav.verifySanad, href: '/verify' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Brand / Logo */}
            <div className="flex items-center gap-3">
                  <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white font-bold shadow-md shadow-emerald-800/15 group-hover:scale-105 transition-transform">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                        SahiTech <span className="text-emerald-700">MDI</span>
                      </span>
                        <span className="text-[11px] text-slate-500 font-medium block leading-none">
                          {t.nav.brandTagline}
                        </span>
                    </div>
                  </Link>
                </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
                      {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`transition-colors py-1 ${isActive
                                ? 'text-emerald-700 font-bold border-b-2 border-emerald-600'
                                : 'hover:text-emerald-700'
                              }`}
                          >
                            {link.name}
                          </Link>
                        );
                      })}

                      <Link
                        href="/register-madrasa"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        {t.nav.registerMadrasa}
                      </Link>
                    </nav>

                        {/* Language Switcher & Auth */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Trilingual Selector */}
                          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs shadow-xs">
                            <Globe className="h-3.5 w-3.5 text-slate-400 mx-1 shrink-0" />
                            <button
                              type="button"
                              onClick={() => handleLocaleChange('bn')}
                              className={`rounded-lg px-2 py-1 font-medium transition ${locale === 'bn'
                                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                              বাংলা
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLocaleChange('en')}
                              className={`rounded-lg px-2 py-1 font-medium transition ${locale === 'en'
                                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                              EN
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLocaleChange('ar')}
                              className={`rounded-lg px-2 py-1 font-medium font-serif transition ${locale === 'ar'
                                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                              العربية
                            </button>
                          </div>

                          {/* Login Button */}
                          <Link
                            href="/login"
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
                          >
                            <User className="h-3.5 w-3.5" />
                            {t.nav.login}
                          </Link>

                          {/* Mobile Menu Hamburger */}
                          <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden inline-flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 transition"
                            aria-label="Toggle mobile menu"
                          >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Mobile Drawer Navigation */}
                      {mobileMenuOpen && (
                        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg">
                          <div className="flex flex-col space-y-1">
                            {navLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${pathname === link.href
                                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                              >
                                {link.name}
                              </Link>
                            ))}
                            <Link
                              href="/register-madrasa"
                              onClick={() => setMobileMenuOpen(false)}
                              className="rounded-lg px-3 py-2 text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition"
                            >
                              + {t.nav.registerMadrasa}
                            </Link>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <Link
                              href="/login"
                              onClick={() => setMobileMenuOpen(false)}
                              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 px-4 text-xs font-bold text-white shadow"
                            >
                              <User className="h-4 w-4" />
                              {t.nav.login}
                            </Link>
                          </div>
                        </div>
                      )}
                    </header>
                    );
}
