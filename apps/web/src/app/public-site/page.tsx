import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

/**
 * Authenticated workspace shortcut: open the public website for the selected
 * institution. The public URL itself is /m/[subdomain] and can be shared
 * without being logged in.
 */
export default async function PublicInstitutionalSiteShortcut() {
  const context = await getActiveTenantContext();
  if (!context) redirect('/login?redirectTo=%2Fpublic-site');
  if (!context.tenantSubdomain) redirect('/dashboard/settings?error=public-site-slug-missing');

  redirect(`/m/${encodeURIComponent(context.tenantSubdomain)}`);
}
