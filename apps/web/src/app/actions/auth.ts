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

export type InitialPasswordChangeState = { success: boolean; error?: string; redirectTo?: string };

export async function changeInitialMadrasaAdminPassword(
  _previousState: InitialPasswordChangeState,
  formData: FormData,
): Promise<InitialPasswordChangeState> {
  const password = formData.get('password');
  const confirmation = formData.get('confirmPassword');

  if (typeof password !== 'string' || typeof confirmation !== 'string' || password !== confirmation) {
    return { success: false, error: 'দুটি Password মিলছে না।' };
  }
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return { success: false, error: 'নতুন Password কমপক্ষে ১২ অক্ষরের হতে হবে এবং বড় হাতের, ছোট হাতের অক্ষর ও সংখ্যা থাকতে হবে।' };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.app_metadata?.mdi_manual_madrasa_admin !== true) {
    return { success: false, error: 'এই অ্যাকাউন্টে MDI Manual Admin Password Change অনুমোদিত নয়।' };
  }

  // This RPC checks current database Auth metadata (not only a potentially stale JWT).
  const { data: passwordChangeRequired, error: gateError } =
    await (supabase.rpc as any)('mdi_manual_password_change_required');
  if (gateError || passwordChangeRequired !== true) {
    return { success: false, error: 'Password Change gate যাচাই করা যায়নি অথবা এই অ্যাকাউন্টে আর প্রাথমিক Password Change প্রয়োজন নেই।' };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    return { success: false, error: 'নতুন Password সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' };
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
    return { success: false, error: 'Password পরিবর্তন হয়েছে, কিন্তু নিরাপত্তা অবস্থা আপডেট হয়নি। Dashboard প্রবেশ বন্ধ থাকবে; Support-এ যোগাযোগ করুন।' };
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...nextAppMetadata, mdi_force_password_change: true },
    });
    await supabase.auth.signOut();
    return { success: false, error: 'নিরাপদ Session Refresh হয়নি। নতুন Password দিয়ে আবার Login করুন।' };
  }

  const { error: auditError } = await (supabase.rpc as any)('record_manual_admin_password_change');
  if (auditError) {
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...nextAppMetadata, mdi_force_password_change: true },
    });
    await supabase.auth.refreshSession();
    return { success: false, error: 'Password পরিবর্তন হয়েছে, কিন্তু Security Audit নিশ্চিত হয়নি। নিরাপত্তার জন্য Dashboard প্রবেশ বন্ধ রাখা হয়েছে; Support-এ যোগাযোগ করুন।' };
  }

  revalidatePath('/', 'layout');
  return { success: true, redirectTo: '/dashboard' };
}

// Backward-compatible Server Action name used by the initial password-change route.
export async function completeInitialPasswordChange(
  previousState: InitialPasswordChangeState,
  formData: FormData,
): Promise<InitialPasswordChangeState> {
  return changeInitialMadrasaAdminPassword(previousState, formData);
}
