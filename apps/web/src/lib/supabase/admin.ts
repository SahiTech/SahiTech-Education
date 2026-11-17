import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Auth Admin access is deliberately isolated to server-only code.
 * Never import this module from a Client Component or expose the service-role key.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server-side Supabase Admin API is not configured.');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
