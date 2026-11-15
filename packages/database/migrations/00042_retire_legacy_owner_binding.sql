-- MDI 00042: retire legacy browser-driven and Auth-trigger owner binding.
-- This is intentionally guarded: trusted provisioning must have already bound the singleton Owner.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM private.platform_owner
    WHERE singleton = TRUE AND auth_user_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'trusted_platform_owner_binding_required_before_retiring_legacy_binding';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.bind_platform_owner() FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.bind_platform_owner();

DROP FUNCTION private.bind_current_platform_owner();

DROP TRIGGER IF EXISTS bind_verified_platform_owner ON auth.users;
DROP FUNCTION private.bind_verified_platform_owner();

COMMENT ON TABLE private.platform_owner IS
  'Singleton Global Platform Owner binding. auth_user_id is immutable during normal login; provisioning is an out-of-band trusted administrative operation.';
