'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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


export async function changeInitialMadrasaAdminPassword(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (typeof password !== 'string' || password.length < 12) {
    return { success: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।' };
  }
  if (password !== confirmPassword) {
    return { success: false, error: 'দুটি পাসওয়ার্ড মিলছে না।' };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user
    || user.app_metadata?.mdi_manual_madrasa_admin !== true
    || user.app_metadata?.mdi_force_password_change !== true) {
    return { success: false, error: 'এই অ্যাকাউন্টের প্রথম Login Password Change অনুমোদিত নয়।' };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    return { success: false, error: 'নতুন পাসওয়ার্ড সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' };
  }

  const nextAppMetadata = {
    ...user.app_metadata,
    mdi_manual_madrasa_admin: true,
    mdi_force_password_change: false,
    mdi_password_changed_at: now,
  };
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: nextAppMetadata,
  });

  if (metadataError) {
    return { success: false, error: 'Password পরিবর্তন হয়েছে, কিন্তু নিরাপত্তা অবস্থা আপডেট হয়নি। Support-এ যোগাযোগ করুন; Dashboard প্রবেশ বন্ধ থাকবে।' };
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...nextAppMetadata,
        mdi_force_password_change: true,
      },
    });
    return { success: false, error: 'নিরাপদ Session Refresh সম্পন্ন হয়নি। পুনরায় Login করে চেষ্টা করুন।' };
  }

  const { error: auditError } = await (supabase.rpc as any)('record_manual_admin_password_change');
  if (auditError) {
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...nextAppMetadata,
        mdi_force_password_change: true,
      },
    });
    await supabase.auth.refreshSession();
    return { success: false, error: 'Password পরিবর্তন হয়েছে, কিন্তু Security Audit নিশ্চিত হয়নি। আবার Login করে Support-এ যোগাযোগ করুন।' };
  }

  revalidatePath('/', 'layout');
  return { success: true, redirectTo: '/dashboard' };
}
