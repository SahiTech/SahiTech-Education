import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicSiteView } from '@/app/public-site/public-site-view';
import { getServerDictionary } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

type RouteProps = {
  params: Promise<{ subdomain: string }>;
};

async function getPublicInstitution(subdomain: string) {
  const normalizedSlug = subdomain.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalizedSlug)) return null;

  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, subdomain, code, curriculum_type, motto_bn, motto_en, established_year, district, contact_phone, contact_email, address, logo_url')
    .eq('subdomain', normalizedSlug)
    .eq('is_active', true)
    .eq('platform_status', 'active')
    .maybeSingle();

  if (error || !tenant) return null;

  const { data: notices } = await supabase
    .from('tenant_notices')
    .select('id, title_bn, title_en, content_bn, content_en, published_at, created_at')
    .eq('tenant_id', tenant.id)
    .eq('is_public', true)
    .order('published_at', { ascending: false })
    .limit(8);

  return { tenant, notices: notices || [] };
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { subdomain } = await params;
  const result = await getPublicInstitution(subdomain);
  if (!result) return { title: 'Institution not found | SahiTech Education' };

  return {
    title: result.tenant.name,
    description: result.tenant.motto_en || result.tenant.motto_bn || result.tenant.name,
    alternates: { canonical: `/m/${result.tenant.subdomain}` },
    openGraph: {
      type: 'website',
      url: `https://sahitech.dpdns.org/m/${result.tenant.subdomain}`,
      siteName: result.tenant.name,
      title: result.tenant.name,
      description: result.tenant.motto_en || result.tenant.motto_bn || result.tenant.name,
    },
  };
}

export default async function MadrasaPublicWebsitePage({ params }: RouteProps) {
  const [{ subdomain }, dict] = await Promise.all([params, getServerDictionary()]);
  const result = await getPublicInstitution(subdomain);
  if (!result) notFound();
  const copy = dict.publicSite;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {result.tenant.logo_url && <img src={result.tenant.logo_url} alt="" className="h-11 w-11 rounded-xl bg-white object-contain p-1" />}
            <div className="min-w-0">
              <span className="block truncate text-base font-extrabold leading-tight text-slate-900">{result.tenant.name}</span>
              <span className="block text-[10px] text-slate-400">{copy.siteLabel} · {result.tenant.code}</span>
            </div>
          </div>
          <a href="/login" className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            {copy.adminLogin}
          </a>
        </header>

        <PublicSiteView tenant={result.tenant} notices={result.notices} />

        <footer className="space-y-2 border-t border-slate-200 pb-8 pt-6 text-center text-xs text-slate-400">
          <p>{copy.poweredBy} <strong className="text-slate-700">SahiTech Education</strong> · Madrasa Digitalization Initiative (MDI)</p>
          <p>{result.tenant.name} · {result.tenant.code}</p>
        </footer>
      </div>
    </div>
  );
}
