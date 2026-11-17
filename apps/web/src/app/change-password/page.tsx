import { redirect } from 'next/navigation';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ChangePasswordForm } from './change-password-form';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect('/login');
  if (user.app_metadata?.mdi_force_password_change !== true) redirect('/dashboard');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white">
          <KeyRound className="h-6 w-6" />
        </div>
        <div className="mt-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">SahiTech Education · MDI</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">প্রথম Login নিরাপত্তা</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            আপনার অ্যাকাউন্টে একটি Temporary Password ব্যবহার করা হয়েছে। MDI ব্যবহার শুরু করার আগে নিজের নতুন Password তৈরি করুন।
          </p>
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Password পরিবর্তন না করা পর্যন্ত Dashboard ও প্রতিষ্ঠানের তথ্য অ্যাক্সেস বন্ধ থাকবে।
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
