import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { selectTenantForCurrentUser } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function SelectTenantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  const { data: memberships, error } = await (supabase.from('tenant_users') as any)
    .select('tenant_id, role, tenants:tenants!tenant_users_tenant_id_fkey ( id, name, code, is_active, platform_status )')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-12">
        <section role="alert" className="w-full rounded-2xl border border-amber-200 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-black text-slate-900">প্রতিষ্ঠান নির্বাচন যাচাই করা যাচ্ছে না</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">আপনার মাদরাসার সদস্যপদ এই মুহূর্তে যাচাই করা যায়নি। আবার লগইন করুন অথবা Platform Support-এর সঙ্গে যোগাযোগ করুন।</p>
          <a href="/login" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white">Login পেজে ফিরে যান</a>
        </section>
      </main>
    );
  }

  const choices = (memberships || []).filter((membership: any) =>
    membership.tenants &&
    (membership.tenants.is_active === true || membership.tenants.platform_status === 'pending_activation')
  );

  if (choices.length === 0) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-12">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-black text-slate-900">কোনো সক্রিয় Madrasa Membership পাওয়া যায়নি</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">এই অ্যাকাউন্টের সঙ্গে কোনো Active বা অনুমোদিত Madrasa যুক্ত নেই। আপনার প্রতিষ্ঠানের দায়িত্বপ্রাপ্ত ব্যক্তি অথবা SahiTech Education Support-এর সঙ্গে যোগাযোগ করুন।</p>
          <a href="/login" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700">অন্য অ্যাকাউন্ট দিয়ে Login</a>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">SahiTech Education · MDI</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">আপনার মাদরাসা নির্বাচন করুন</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">আপনার অ্যাকাউন্ট একাধিক প্রতিষ্ঠানের সঙ্গে যুক্ত। কাজ শুরু করার আগে সঠিক প্রতিষ্ঠান নির্বাচন করুন। নির্বাচনটি আপনার সক্রিয় Membership দিয়ে যাচাই করা হবে।</p>
        {params.error === 'invalid-selection' && (
          <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">এই প্রতিষ্ঠানটি নির্বাচন করার অনুমতি নেই অথবা প্রতিষ্ঠানটি আর সক্রিয় নেই।</p>
        )}
        <div className="mt-6 space-y-3">
          {choices.map((membership: any) => (
            <form key={membership.tenant_id} action={selectTenantForCurrentUser}>
              <input type="hidden" name="tenantId" value={membership.tenant_id} />
              <button type="submit" className="flex min-h-16 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-emerald-500 hover:bg-emerald-50">
                <span>
                  <span className="block font-bold text-slate-900">{membership.tenants.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">Code: {membership.tenants.code} · Role: {membership.role}</span>
                </span>
                <span className="text-sm font-bold text-emerald-800">Select →</span>
              </button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
