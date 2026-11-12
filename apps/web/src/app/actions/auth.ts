'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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
