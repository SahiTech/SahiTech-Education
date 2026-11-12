import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ArrowLeft, 
  ShieldCheck, 
  BookMarked, 
  Users, 
  Receipt, 
  GraduationCap 
} from 'lucide-react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';

export default async function PortalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/dashboard');
  }

  const portalNav = [
    { name: 'মুহতামিম প্রশাসন', role: 'admin', href: '/portals/admin', icon: Building2 },
    { name: "নাজেমে তা'লীমাত", role: 'academic', href: '/portals/academic', icon: BookMarked },
    { name: 'আসতিযা ওয়ার্কস্পেস', role: 'faculty', href: '/portals/faculty', icon: GraduationCap },
    { name: 'হিসাব ও ক্যাশ কাউন্টার', role: 'bursar', href: '/portals/bursar', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              মূল ড্যাশবোর্ড
            </Link>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{context.tenantName}</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                {context.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-slate-500 hidden sm:inline">
              সুরক্ষিত পোর্টাল অ্যাক্সেস
            </span>
          </div>
        </div>

        {/* Portals Sub-navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 flex items-center gap-1 overflow-x-auto py-1">
          {portalNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/70 transition shrink-0"
              >
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

