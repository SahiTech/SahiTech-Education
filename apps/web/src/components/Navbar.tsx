'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Globe2, Menu, PlusCircle, User, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/types';

export function Navbar() {
  const { locale, setLocale, t, direction } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: t.nav.overview, href: '/dashboard' },
    { name: t.nav.academic, href: '/dashboard/academic' },
    { name: t.nav.students, href: '/dashboard/students' },
    { name: t.nav.publicSite, href: '/public-site' },
    { name: t.nav.verifySanad, href: '/verify' },
  ];

  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setMobileMenuOpen(false);
  };

  const localeButton = (value: Locale, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => changeLocale(value)}
      aria-pressed={locale === value}
      className={`min-h-8 rounded-lg px-2.5 text-xs font-semibold transition ${locale === value
        ? 'bg-[#123D32] text-white shadow-sm'
        : 'text-[#50615A] hover:bg-[#EAE7DE] hover:text-[#17372D]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <header dir={direction} className="sticky top-0 z-50 w-full border-b border-[#E7E0D3] bg-[#FBFAF6]/95 shadow-[0_4px_18px_rgba(20,48,37,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="SahiTech Education home">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#C5A66B]/50 bg-[#123D32] text-[#E9D8B7] shadow-md shadow-[#123D32]/10 transition group-hover:-translate-y-0.5">
            <BookOpen className="h-5 w-5" strokeWidth={1.8} />
            <span aria-hidden="true" className="absolute -end-1 -top-1 h-3 w-3 rounded-full border-2 border-[#FBFAF6] bg-[#C5A66B]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold tracking-tight text-[#17372D] sm:text-base">SahiTech Education</span>
            <span className="mt-1 block truncate text-[10px] font-medium leading-tight text-[#69736E] sm:text-[11px]">{t.nav.brandTagline}</span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-5 text-[13px] font-semibold text-[#526159] xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 py-2 transition ${pathname === link.href
                ? 'border-[#B89455] text-[#123D32]'
                : 'border-transparent hover:border-[#D6C29B] hover:text-[#123D32]'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-0.5 rounded-xl border border-[#E7E0D3] bg-white p-1" aria-label="Language selector">
            <Globe2 className="mx-1 hidden h-3.5 w-3.5 text-[#8C948E] sm:block" />
            {localeButton('bn', 'বাংলা')}
            {localeButton('en', 'EN')}
            {localeButton('ar', 'عربي')}
          </div>

          <Link
            href="/login"
            className="hidden min-h-10 items-center gap-2 rounded-xl bg-[#123D32] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B2B24] sm:inline-flex"
          >
            <User className="h-3.5 w-3.5" />
            {t.nav.login}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7E0D3] bg-white text-[#17372D] transition hover:bg-[#F0ECE2] xl:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#E7E0D3] bg-[#FBFAF6] px-4 pb-5 pt-3 shadow-lg xl:hidden sm:px-6">
          <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${pathname === link.href
                  ? 'bg-[#EAF0E9] text-[#123D32]'
                  : 'text-[#526159] hover:bg-[#F0ECE2] hover:text-[#123D32]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/register-madrasa"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#C5A66B]/50 bg-[#F3EBDD] px-4 py-2.5 text-sm font-bold text-[#624B27]"
            >
              <PlusCircle className="h-4 w-4" />
              {t.nav.registerMadrasa}
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#123D32] px-4 py-2.5 text-sm font-bold text-white"
            >
              <User className="h-4 w-4" />
              {t.nav.login}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
