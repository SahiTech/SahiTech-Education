'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

function safeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/dashboard';
  }
  try {
    const parsed = new URL(value, 'https://local.invalid');
    return parsed.origin === 'https://local.invalid' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

export async function signInWithEmail(prevState: any, formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email');
  const password = formData.get('password');
  const redirectTo = safeRedirectPath(formData.get('redirectTo'));

  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return {
      success: false,
      error: 'ইমেইল এবং পাসওয়ার্ড প্রদান করুন (Please enter email and password)',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return {
      success: false,
      error: 'ভুল ইমেইল বা পাসওয়ার্ড। পুনরায় চেষ্টা করুন।',
    };
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

export async function signOutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export type InitialPasswordChangeState = { error?: string };

export async function completeInitialPasswordChange(
  _previousState: InitialPasswordChangeState,
  formData: FormData,
): Promise<InitialPasswordChangeState> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.app_metadata?.mdi_force_password_change !== true) {
    return { error: 'এই সেশনে প্রাথমিক Password পরিবর্তনের অনুমতি নেই। পুনরায় Login করুন।' };
  }

  const password = formData.get('password');
  const confirmation = formData.get('confirmPassword');
  if (typeof password !== 'string' || typeof confirmation !== 'string' || password !== confirmation) {
    return { error: 'দুটি Password মিলছে না।' };
  }
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: 'নতুন Password কমপক্ষে ১২ অক্ষরের হতে হবে এবং বড় হাতের, ছোট হাতের অক্ষর ও সংখ্যা থাকতে হবে।' };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      app_metadata: {
        ...user.app_metadata,
        mdi_force_password_change: false,
        mdi_password_changed_at: new Date().toISOString(),
      },
    });
    if (error) return { error: 'নতুন Password সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' };

    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      await supabase.auth.signOut();
      return { error: 'Password পরিবর্তন হয়েছে। নিরাপত্তার জন্য আবার নতুন Password দিয়ে Login করুন।' };
    }
  } catch {
    return { error: 'Password পরিবর্তনের server configuration প্রস্তুত নয়। Support-এর সঙ্গে যোগাযোগ করুন।' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
