-- MDI security hardening: keep RLS helper execution out of the exposed SECURITY DEFINER API surface.
-- The private SECURITY DEFINER implementations are narrowly scoped to auth.uid()-bound tenant membership.
-- Public wrappers remain SECURITY INVOKER so existing RLS policy expressions and application calls continue to work.

CREATE OR REPLACE FUNCTION private.get_auth_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT tu.tenant_id
  FROM public.tenant_users AS tu
  JOIN public.tenants AS t ON t.id = tu.tenant_id
  WHERE tu.user_id = (SELECT auth.uid())
    AND tu.is_active = TRUE
    AND tu.role <> 'super_admin'::public.user_role
    AND t.is_active = TRUE
    AND t.platform_status = 'active';
$$;

CREATE OR REPLACE FUNCTION private.has_tenant_onboarding_access(target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users AS tu
    JOIN public.tenants AS t ON t.id = tu.tenant_id
    WHERE tu.tenant_id = target_tenant_id
      AND tu.user_id = (SELECT auth.uid())
      AND tu.role = 'madrasa_admin'::public.user_role
      AND tu.is_active = TRUE
      AND t.platform_status = 'pending_activation'
      AND t.is_active = FALSE
  );
$$;

CREATE OR REPLACE FUNCTION private.has_tenant_onboarding_write(target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users AS tu
    JOIN public.tenants AS t ON t.id = tu.tenant_id
    WHERE tu.tenant_id = target_tenant_id
      AND tu.user_id = (SELECT auth.uid())
      AND tu.role = 'madrasa_admin'::public.user_role
      AND tu.is_active = TRUE
      AND t.platform_status = 'pending_activation'
      AND t.is_active = FALSE
      AND t.onboarding_completed_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION private.has_tenant_role(target_tenant_id uuid, required_roles public.user_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users AS tu
    JOIN public.tenants AS t ON t.id = tu.tenant_id
    WHERE tu.tenant_id = target_tenant_id
      AND tu.user_id = (SELECT auth.uid())
      AND tu.role <> 'super_admin'::public.user_role
      AND tu.role = ANY(array_remove(required_roles, 'super_admin'::public.user_role))
      AND tu.is_active = TRUE
      AND t.is_active = TRUE
      AND t.platform_status = 'active'
  );
$$;

GRANT USAGE ON SCHEMA private TO anon, authenticated;
REVOKE ALL ON FUNCTION private.get_auth_tenant_ids() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_tenant_onboarding_access(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_tenant_onboarding_write(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_tenant_role(uuid, public.user_role[]) FROM PUBLIC, anon, authenticated;

-- The public wrappers execute as the caller and delegate only to auth.uid()-scoped private helpers.
CREATE OR REPLACE FUNCTION public.get_auth_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$ SELECT * FROM private.get_auth_tenant_ids(); $$;

CREATE OR REPLACE FUNCTION public.has_tenant_onboarding_access(target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$ SELECT private.has_tenant_onboarding_access(target_tenant_id); $$;

CREATE OR REPLACE FUNCTION public.has_tenant_onboarding_write(target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$ SELECT private.has_tenant_onboarding_write(target_tenant_id); $$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(target_tenant_id uuid, required_roles public.user_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, private, auth, pg_temp
AS $$ SELECT private.has_tenant_role(target_tenant_id, required_roles); $$;

REVOKE ALL ON FUNCTION public.get_auth_tenant_ids() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_tenant_onboarding_access(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_tenant_onboarding_write(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, public.user_role[]) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.get_auth_tenant_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_tenant_onboarding_access(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_tenant_onboarding_write(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_tenant_role(uuid, public.user_role[]) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_auth_tenant_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_onboarding_access(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_onboarding_write(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, public.user_role[]) TO anon, authenticated;

COMMENT ON FUNCTION private.get_auth_tenant_ids() IS 'Private RLS helper; returns active tenant IDs only for auth.uid().';
COMMENT ON FUNCTION private.has_tenant_onboarding_access(uuid) IS 'Private RLS helper; checks pending-activation tenant membership for auth.uid().';
COMMENT ON FUNCTION private.has_tenant_onboarding_write(uuid) IS 'Private RLS helper; checks onboarding write eligibility for auth.uid().';
COMMENT ON FUNCTION private.has_tenant_role(uuid, public.user_role[]) IS 'Private RLS helper; checks active tenant role membership for auth.uid().';
