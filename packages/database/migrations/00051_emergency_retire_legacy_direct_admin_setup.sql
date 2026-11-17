-- Emergency retirement of the legacy insecure direct-admin provisioning RPC.
-- This function accepted caller-supplied passwords, had a hardcoded fallback,
-- wrote directly to auth.users/auth.identities, and returned password_used.
-- The replacement flow uses Supabase Auth Admin API and Owner AAL2 reservations.
DROP FUNCTION IF EXISTS public.owner_direct_setup_madrasa_admin(UUID,TEXT,BOOLEAN);
