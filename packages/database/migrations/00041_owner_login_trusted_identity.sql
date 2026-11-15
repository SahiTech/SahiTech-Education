-- MDI 00041: expose a minimal trusted-identity preflight for controlled Owner MFA enrollment.
-- This function confirms only the already-bound singleton identity; it does not grant Owner access.
-- Privileged authorization remains private.is_platform_owner(), which requires AAL2.

CREATE OR REPLACE FUNCTION private.is_platform_owner_identity()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM private.platform_owner AS owner_record
      WHERE owner_record.singleton = TRUE
        AND owner_record.auth_user_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION private.is_platform_owner_identity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_platform_owner_identity() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_platform_owner_identity()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
  SELECT private.is_platform_owner_identity();
$$;

REVOKE ALL ON FUNCTION public.is_platform_owner_identity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_owner_identity() TO authenticated;

COMMENT ON FUNCTION private.is_platform_owner_identity() IS
  'Preflight only: confirms the authenticated user UUID is the immutable singleton Global Platform Owner. Does not require AAL2 and grants no privileged data access.';
COMMENT ON FUNCTION public.is_platform_owner_identity() IS
  'Preflight for controlled TOTP enrollment. Returns true only for the already-bound Global Platform Owner identity; all privileged actions still require AAL2.';
