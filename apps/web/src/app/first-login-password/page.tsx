import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FirstLoginPasswordForm from './first-login-password-form';

export const dynamic = 'force-dynamic';

export default async function FirstLoginPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (user.app_metadata?.mdi_manual_madrasa_admin !== true
    || user.app_metadata?.mdi_force_password_change !== true) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white">
          <span className="text-xl font-black">MDI</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">নতুন পাসওয়ার্ড তৈরি করুন</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          এটি আপনার প্রথম Login। নিরাপত্তার জন্য Owner-এর দেওয়া Temporary Password পরিবর্তন না করা পর্যন্ত MDI Dashboard ব্যবহার করা যাবে না।
        </p>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          অন্তত ১২ অক্ষরের একটি ব্যক্তিগত পাসওয়ার্ড তৈরি করুন। এটি কারও সঙ্গে শেয়ার করবেন না।
        </p>
        <FirstLoginPasswordForm />
      </section>
    </main>
  );
}
