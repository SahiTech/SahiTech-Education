import React from 'react';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  BookMarked,
  Receipt,
  GraduationCap,
} from 'lucide-react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { getServerDictionary } from '@/lib/i18n/server';
import { redirect } from 'next/navigation';

export default async function PortalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [context, dict] = await Promise.all([
    getActiveTenantContext(),
    getServerDictionary(),
  ]);

  if (!context) redirect('/dashboard');

  const portalNav = [
    { name: dict.portals.layout.admin, href: '/portals/admin', icon: Building2 },
    { name: dict.portals.layout.academic, href: '/portals/academic', icon: BookMarked },
    { name: dict.portals.layout.faculty, href: '/portals/faculty', icon: GraduationCap },
    { name: dict.portals.layout.bursar, href: '/portals/bursar', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              <span className="hidden sm:inline">{dict.portals.layout.backToDashboard}</span>
              <span className="sm:hidden">{dict.nav.overview}</span>
            </Link>
            <div className="h-4 w-px shrink-0 bg-slate-200" />
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-bold text-slate-900">{context.tenantName}</span>
              <span className="hidden shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 sm:inline-flex">
                {context.role}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span className="hidden text-xs text-slate-500 sm:inline">
              {dict.portals.layout.secureAccess}
            </span>
          </div>
        </div>
        <nav
          aria-label="Institution portals"
          className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1 sm:px-6 lg:px-8"
        >
          {portalNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-emerald-50/70 hover:text-emerald-800"
              >
                <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
