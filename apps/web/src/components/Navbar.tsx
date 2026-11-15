'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Locale } from '@/lib/i18n/types';
import { BookOpen, Globe, User, PlusCircle, Menu, X } from 'lucide-react';

interface NavbarProps {
  user?: { email?: string } | null;
}

export function Navbar({ user }: NavbarProps) {
  const { locale, setLocale, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isWorkspaceExperience = ['/dashboard', '/portals', '/public-site'].some((route) => pathname === route || pathname.startsWith(route + '/'));

  const portalLinks = [
    { name: t.nav.overview, href: '/dashboard' },
    { name: t.nav.academic, href: '/dashboard/academic' },
    { name: t.nav.students, href: '/dashboard/students' },
    { name: t.nav.publicSite, href: '/public-site' },
    { name: t.nav.verifySanad, href: '/verify' },
  ];
  const publicLinks = [
    { name: t.home.featuresTitle, href: '/#capabilities' },
    { name: t.nav.verifySanad, href: '/verify' },
  ];
  const navLinks = isWorkspaceExperience ? portalLinks : publicLinks;

  const handleLocaleChange = (newLocale: Locale) => setLocale(newLocale);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e9e3d7] bg-[#fbfaf6]/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#17604b] to-[#0a342c] text-white shadow-md transition-transform group-hover:scale-105">
            <BookOpen className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-black leading-tight tracking-tight text-[#153d32] sm:text-lg">SahiTech Education</span>
            <span className="mt-1 block text-[10px] font-medium leading-none text-[#8b7650] sm:text-[11px]">{t.nav.brandTagline}</span>
          </span>
        </Link>

        <nav aria-label={isWorkspaceExperience ? 'Workspace navigation' : 'Public navigation'} className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`py-2 transition-colors ${pathname === link.href ? 'font-bold text-[#17604b]' : 'text-slate-600 hover:text-[#17604b]'}`}>
              {link.name}
            </Link>
          ))}
          <Link href="/register-madrasa" className="inline-flex items-center gap-2 rounded-lg bg-[#174c3d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0d3b30]">
            <PlusCircle className="h-4 w-4" />
            {t.nav.registerMadrasa}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-xl border border-[#e5dfd2] bg-white p-1 text-xs">
            <Globe className="mx-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
            {(['bn', 'en', 'ar'] as Locale[]).map((code) => (
              <button key={code} type="button" onClick={() => handleLocaleChange(code)} aria-pressed={locale === code} className={`rounded-lg px-2 py-1.5 font-medium transition ${locale === code ? 'bg-[#17604b] font-bold text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                {code === 'bn' ? 'বাংলা' : code === 'en' ? 'EN' : 'العربية'}
              </button>
            ))}
          </div>
          <Link href="/login" className="hidden min-h-10 items-center gap-2 rounded-lg border border-[#d8e2dc] px-3 py-2 text-xs font-semibold text-[#174c3d] transition hover:bg-[#edf4ef] sm:inline-flex">
            <User className="h-3.5 w-3.5" />
            {t.nav.login}
          </Link>
          <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-[#eeeade] lg:hidden" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} aria-controls="site-mobile-navigation">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="site-mobile-navigation" className="border-t border-[#e9e3d7] bg-[#fbfaf6] px-4 py-4 shadow-lg lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMenu} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#eeeade] hover:text-[#174c3d]">
                {link.name}
              </Link>
            ))}
            <Link href="/register-madrasa" onClick={closeMenu} className="mt-2 rounded-lg bg-[#174c3d] px-3 py-3 text-sm font-bold text-white">
              {t.nav.registerMadrasa}
            </Link>
            <Link href="/login" onClick={closeMenu} className="rounded-lg px-3 py-3 text-sm font-semibold text-[#174c3d]">
              {t.nav.login}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
