import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { PublicSiteView } from './public-site-view';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublicInstitutionalSitePage() {
  const supabase = await createClient();

  // Fetch active tenant (or first tenant)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let notices: any[] = [];
  if (tenant) {
    const { data: nList } = await supabase
      .from('tenant_notices')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(6);
    notices = nList || [];
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-700" />
            <div>
              <span className="font-extrabold text-base text-slate-900 block leading-tight">
                {tenant?.name || 'SahiTech Education MDI'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Institutional Public Portal · প্রাতিষ্ঠানিক ওয়েবসাইট
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              প্রশাসনিক পোর্টাল লগইন
            </Link>
          </div>
        </div>

        <PublicSiteView tenant={tenant} notices={notices} />

        {/* Footer */}
        <div className="border-t border-slate-200 pt-8 pb-12 text-center text-xs text-slate-400 space-y-2">
          <div>
            Powered by <strong className="text-slate-700">SahiTech Education</strong> · Madrasa Digitalization Initiative (MDI)
          </div>
          <div>
            জাতীয় কওমি ও আলিয়া মাদ্রাসা শিক্ষা সমন্বয়কারী আধুনিক ক্লাউড ইকোসিস্টেম
          </div>
        </div>
      </div>
    </div>
  );
}
