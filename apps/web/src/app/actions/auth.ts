'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export async function signInWithEmail(prevState: any, formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

  if (!email || !password) {
    return {
      success: false,
      error: 'ইমেইল এবং পাসওয়ার্ড প্রদান করুন (Please enter email and password)',
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message === 'Invalid login credentials' 
        ? 'ভুল ইমেইল বা পাসওয়ার্ড। পুনরায় চেষ্টা করুন।' 
        : error.message,
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
