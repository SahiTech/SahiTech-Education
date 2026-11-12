'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookMarked, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  Receipt, 
  Building2, 
  Settings,
  Sparkles 
} from 'lucide-react';

const navigationItems = [
  { name: 'ড্যাশবোর্ড', enName: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'অনবোর্ডিং উইজার্ড', enName: 'Setup Wizard', href: '/onboarding', icon: Sparkles },
  { name: 'একাডেমিক ও কিতাব', enName: 'Curriculum & Kitab', href: '/dashboard/academic', icon: BookMarked },
  { name: 'শিক্ষার্থী ও ভর্তি', enName: 'Students & Admission', href: '/dashboard/students', icon: Users },
  { name: 'আসতিযা ও স্টাফ', enName: 'Teachers & Staff', href: '/dashboard/teachers', icon: GraduationCap },
  { name: 'উপস্থিতি (হাজিরা)', enName: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
  { name: 'হিসাব ও মাহাদ ফান্ড', enName: 'Finance & Fees', href: '/dashboard/finance', icon: Receipt },
  { name: 'দারুল ইক্বামাহ (হোস্টেল)', enName: 'Hostel & Boarding', href: '/dashboard/hostel', icon: Building2 },
  { name: 'মাদ্রাসা সেটিংস', enName: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const portalItems = [
  { name: 'মুহতামিম পোর্টাল', href: '/portals/admin', icon: Building2 },
  { name: "নাজেমে তা'লীমাত", href: '/portals/academic', icon: BookMarked },
  { name: 'আসতিযা ওয়ার্কস্পেস', href: '/portals/faculty', icon: GraduationCap },
  { name: 'ক্যাশ কাউন্টার', href: '/portals/bursar', icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-4">
        <div>
          <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            মূল ব্যবস্থাপনা (Core Modules)
          </div>
          <div className="space-y-0.5 mt-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-sm border border-emerald-200/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">{item.enName}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            দায়িত্ব পোর্টাল (Portals)
          </div>
          <div className="space-y-0.5 mt-1">
            {portalItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-slate-600">
        <div className="font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          সক্রিয় সংযোগ
        </div>
        <div>Supabase Postgres 17 (ap-south-1)</div>
        <div className="text-[10px] text-slate-400 mt-1">Tenant RLS: Active</div>
      </div>
    </aside>
  );
}

