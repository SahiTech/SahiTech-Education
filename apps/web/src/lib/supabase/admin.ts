import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Privileged Auth client. This module must only be imported by server-only
 * modules (Route Handlers / Server Actions). Never add its key to NEXT_PUBLIC_*.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error('Manual account provisioning is unavailable: server-side Supabase Auth credentials are not configured.');
  }

  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
