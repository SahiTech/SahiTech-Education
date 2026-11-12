'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import {
  LayoutDashboard,
  BookMarked,
  Users,
  GraduationCap,
  CalendarCheck,
  Receipt,
  Building2,
  Sparkles,
  Award,
  FileCheck2,
  HeartHandshake,
  BarChart3,
  Globe,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { t, direction, locale } = useI18n();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    { name: t.nav.overview, href: '/dashboard', icon: LayoutDashboard },
    { name: t.nav.wizard, href: '/onboarding', icon: Sparkles },
    { name: t.nav.admissions, href: '/dashboard/admissions', icon: FileCheck2 },
    { name: t.nav.students, href: '/dashboard/students', icon: Users },
    { name: t.nav.academic, href: '/dashboard/academic', icon: BookMarked },
    { name: t.nav.exams, href: '/dashboard/academic/exams', icon: Award },
    { name: t.nav.sanad, href: '/dashboard/academic/sanad', icon: ShieldCheck },
    { name: t.nav.hostel, href: '/dashboard/hostel', icon: Building2 },
    { name: t.nav.lillah, href: '/dashboard/lillah', icon: HeartHandshake },
    { name: t.nav.teachers, href: '/dashboard/teachers', icon: GraduationCap },
    { name: t.nav.attendance, href: '/dashboard/attendance', icon: CalendarCheck },
    { name: t.nav.finance, href: '/dashboard/finance', icon: Receipt },
    { name: t.nav.reports, href: '/dashboard/reports', icon: BarChart3 },
    { name: t.nav.settings, href: '/dashboard/settings', icon: Settings },
  ];

  const portalItems = [
    { name: t.nav.adminPortal, href: '/portals/admin', icon: Building2 },
    { name: t.nav.academicPortal, href: '/portals/academic', icon: BookMarked },
    { name: t.nav.facultyPortal, href: '/portals/faculty', icon: GraduationCap },
    { name: t.nav.bursarPortal, href: '/portals/bursar', icon: Receipt },
  ];

    const publicLinks = [
      { name: t.nav.publicSite, href: '/public-site', icon: Globe },
      { name: t.nav.verifySanad, href: '/verify', icon: ShieldCheck },
    ];

          const sidebarContent = (
          <div className="flex flex-col justify-between h-full p-4 space-y-4">
            <div className="space-y-5">
              {/* Core Modules Section */}
              <div>
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {locale === 'bn' ? 'মূল মডিউল' : locale === 'ar' ? 'الوحدات الأساسية' : 'Core Modules'}
                  </div>
                    <div className="space-y-1 mt-1 max-h-[50vh] overflow-y-auto pr-1">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition min-h-[40px] ${isActive
                            ? 'bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-800/10'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                    );
            })}
                  </div>
                </div>

                {/* Portals Section */}
                <div>
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t.nav.portals}
                    </div>
                      <div className="space-y-1 mt-1">
                        {portalItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium transition min-h-[36px] ${isActive
                            ? 'bg-emerald-100 text-emerald-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                >
                        <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                      );
            })}
                    </div>
                  </div>

                  {/* Public Tools Section */}
                  <div>
                      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {locale === 'bn' ? 'পাবলিক টুলস' : locale === 'ar' ? 'الأدوات العامة' : 'Public Tools'}
                      </div>
                        <div className="space-y-1 mt-1">
                          {publicLinks.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium transition min-h-[36px] ${isActive
                              ? 'bg-emerald-100 text-emerald-900 font-bold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                >
                          <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </Link>
                        );
            })}
                      </div>
                    </div>
                  </div>

                    {/* Cloud & Tenant Isolation Badge */}
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-xs text-slate-600 shadow-xs">
                      <div className="font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t.nav.connectionActive}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">Postgres 17 (ap-south-1)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{t.nav.tenantRlsActive}</div>
                    </div>
                </div>
                );

                return (
                <>
                  {/* Mobile Floating Drawer Button */}
                  <div className="md:hidden fixed bottom-4 right-4 z-40">
                    <button
                      type="button"
                      onClick={() => setIsMobileOpen(true)}
                      className="flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-900/30 hover:bg-emerald-800 transition active:scale-95"
                      aria-label="Open navigation sidebar"
                    >
                      <Menu className="h-4 w-4" />
                      <span>{locale === 'bn' ? 'মেনু' : locale === 'ar' ? 'القائمة' : 'Menu'}</span>
                    </button>
                  </div>

                  {/* Mobile Backdrop & Drawer */}
                  {isMobileOpen && (
                    <div className="md:hidden fixed inset-0 z-50 flex">
                      <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsMobileOpen(false)}
                      />
                      <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-50">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                          <span className="font-bold text-sm text-slate-800">
                            {locale === 'bn' ? 'মাদরাসা নেভিগেশন' : locale === 'ar' ? 'التنقل في النظام' : 'Navigation'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {sidebarContent}
                        </div>
                      </aside>
                    </div>
                  )}

                  {/* Desktop Persistent Sidebar */}
                  <aside className="hidden md:flex w-64 border-r rtl:border-r-0 rtl:border-l border-slate-200 bg-white min-h-[calc(100vh-4rem)] flex-col justify-between shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                    {sidebarContent}
                  </aside>
                </>
                );
}
