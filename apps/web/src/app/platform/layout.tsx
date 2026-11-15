import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, FileCheck2, Building2, History, ShieldCheck, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

const navigation = [
  { label: 'Overview', href: '/platform#overview', icon: LayoutDashboard },
  { label: 'Applications', href: '/platform#applications', icon: FileCheck2 },
  { label: 'Institutions', href: '/platform#institutions', icon: Building2 },
  { label: 'Audit trail', href: '/platform#audit', icon: History },
];

export default async function GlobalOwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/platform/login');
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') redirect('/platform/login');
  const { data: isOwner, error } = await (supabase.rpc as any)('is_platform_owner');
  if (error || isOwner !== true) redirect('/platform/login');

  return (
    <div className="min-h-screen bg-[#f4f6f4] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-[#102f29] text-white lg:flex lg:flex-col">
          <Link href="/platform" className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200"><ShieldCheck className="h-5 w-5"/></span>
            <span><span className="block text-sm font-bold tracking-tight">SahiTech Education</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">Global Owner</span></span>
          </Link>
          <div className="px-4 pt-7">
            <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/45">Workspace</p>
            <nav className="space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-emerald-50/75 transition hover:bg-white/10 hover:text-white">
                  <Icon className="h-4 w-4 text-emerald-200/75"/>{item.label}
                </Link>;
              })}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100"><span className="h-2 w-2 rounded-full bg-emerald-400"/><Sparkles className="h-3.5 w-3.5"/> Secure owner session</div>
              <p className="mt-2 break-all text-[11px] leading-5 text-emerald-50/55">{user.email}</p>
              <p className="mt-2 text-[10px] text-emerald-100/45">MFA verified · AAL2</p>
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 sm:px-7">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Madrasa Digitalization Initiative</p><p className="mt-0.5 text-sm font-semibold text-slate-800">Global administration workspace</p></div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Owner · MFA secured</div>
            </div>
            <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
              {navigation.map((item) => <Link key={item.href} href={item.href} className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800">{item.label}</Link>)}
            </nav>
          </header>
          <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
