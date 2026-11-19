'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    return {
      success: false,
      error: 'ভুল MDI Login ID বা পাসওয়ার্ড। পুনরায় চেষ্টা করুন।',
    };
  }

  const cookieStore = await cookies();
  // A previous user's tenant selection must not leak into this new sign-in.
  cookieStore.delete('m_active_tenant');

  // This query intentionally reads only the user's own active membership rows.
  // During first login, tenant-feature RLS remains gated until the temporary password
  // is changed, so joining tenant records here would incorrectly hide the membership.
  const { data: memberships, error: membershipError } = await (supabase.from('tenant_users') as any)
    .select('tenant_id')
    .eq('user_id', data.user.id)
    .eq('is_active', true);

  if (membershipError) {
    await supabase.auth.signOut();
    return { success: false, error: 'আপনার মাদরাসার সদস্যপদ যাচাই করা যায়নি। আবার চেষ্টা করুন।' };
  }

  const selectableMemberships = memberships || [];
  if (selectableMemberships.length === 0) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: 'এই MDI Login ID-এর সঙ্গে কোনো সক্রিয় মাদরাসার সদস্যপদ পাওয়া যায়নি। প্রতিষ্ঠানের Owner-এর সঙ্গে যোগাযোগ করুন।',
    };
  }

  if (selectableMemberships.length === 1) {
    cookieStore.set('m_active_tenant', selectableMemberships[0].tenant_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    revalidatePath('/', 'layout');
    redirect('/select-tenant');
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

export async function selectTenantForCurrentUser(formData: FormData): Promise<void> {
  const tenantId = formData.get('tenantId');
  if (typeof tenantId !== 'string' || !/^[0-9a-f-]{36}$/i.test(tenantId)) {
    redirect('/select-tenant?error=invalid-selection');
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect('/login');

  // The submitted tenant ID is only a selector. Membership, active status and
  // tenant lifecycle are re-verified against the authenticated database session.
  const { data: membership, error } = await (supabase.from('tenant_users') as any)
    .select('tenant_id, tenants:tenants!tenant_users_tenant_id_fkey ( id, is_active, platform_status )')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .maybeSingle();

  const tenant = membership?.tenants;
  if (error || !membership || !tenant ||
      (tenant.is_active !== true && tenant.platform_status !== 'pending_activation')) {
    redirect('/select-tenant?error=invalid-selection');
  }

  const cookieStore = await cookies();
  cookieStore.set('m_active_tenant', membership.tenant_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOutUser() {
  const [supabase, cookieStore] = await Promise.all([createClient(), cookies()]);
  await supabase.auth.signOut();
  // Tenant selection is not an authorization grant, but it must not survive logout.
  cookieStore.delete('m_active_tenant');
  revalidatePath('/', 'layout');
  redirect('/login');
}

export type InitialPasswordChangeState = { success: boolean; error?: string; redirectTo?: string };

export async function changeInitialMadrasaAdminPassword(
  _previousState: InitialPasswordChangeState,
  formData: FormData,
): Promise<InitialPasswordChangeState> {
  const currentPassword = formData.get('currentPassword');
  const password = formData.get('password');
  const confirmation = formData.get('confirmPassword');

  if (typeof currentPassword !== 'string' || currentPassword.length === 0 || currentPassword.length > 1024) {
    return { success: false, error: 'Owner-এর দেওয়া Temporary Password দিন।' };
  }
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
  // Supabase Auth is configured to require proof of the current password.
  // Never log either password; only record the provider error code and HTTP status.
  const { error: passwordError } = await supabase.auth.updateUser({
    password,
    current_password: currentPassword,
  });
  if (passwordError) {
    const errorCode = passwordError.code ?? 'unknown';
    console.warn('[mdi:first-login-password] Supabase rejected password update', {
      code: errorCode,
      status: passwordError.status ?? null,
    });

    if (errorCode === 'current_password_required' || errorCode === 'current_password_mismatch') {
      return { success: false, error: 'Temporary Password সঠিক নয়। Owner-এর দেওয়া Temporary Password আবার যাচাই করুন।' };
    }
    if (errorCode === 'same_password') {
      return { success: false, error: 'নতুন Password অবশ্যই Temporary Password থেকে আলাদা হতে হবে।' };
    }
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
