-- MDI 00022: enforce platform/tenant role separation and protect lifecycle columns.
CREATE OR REPLACE FUNCTION public.get_auth_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT tenant_id
  FROM public.tenant_users
  WHERE user_id=(SELECT auth.uid())
    AND is_active=TRUE
    AND role <> 'super_admin'::public.user_role;
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(
  target_tenant_id UUID,
  required_roles public.user_role[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE tenant_id=target_tenant_id
      AND user_id=(SELECT auth.uid())
      AND role <> 'super_admin'::public.user_role
      AND role = ANY(array_remove(required_roles,'super_admin'::public.user_role))
      AND is_active=TRUE
  );
$$;

CREATE OR REPLACE FUNCTION private.reject_legacy_super_admin_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NEW.role='super_admin'::public.user_role THEN
    RAISE EXCEPTION 'super_admin_is_not_a_tenant_role' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.reject_legacy_super_admin_membership() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reject_legacy_super_admin_membership ON public.tenant_users;
CREATE TRIGGER reject_legacy_super_admin_membership
BEFORE INSERT OR UPDATE OF role ON public.tenant_users
FOR EACH ROW EXECUTE FUNCTION private.reject_legacy_super_admin_membership();

CREATE OR REPLACE FUNCTION private.guard_tenant_platform_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
BEGIN
  IF ROW(NEW.is_active,NEW.is_verified,NEW.platform_status,NEW.source_application_id)
     IS DISTINCT FROM
     ROW(OLD.is_active,OLD.is_verified,OLD.platform_status,OLD.source_application_id) THEN

    IF private.is_platform_owner() THEN
      RETURN NEW;
    END IF;

    -- Tenant administrators may complete onboarding by moving a tenant into
    -- pending review, but may never activate, verify, suspend or rebind it.
    IF NEW.is_active=FALSE
       AND NEW.is_verified=FALSE
       AND NEW.platform_status='pending_activation'
       AND NEW.source_application_id IS NOT DISTINCT FROM OLD.source_application_id THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'platform_tenant_lifecycle_is_owner_managed' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_tenant_platform_lifecycle() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_tenant_platform_lifecycle ON public.tenants;
CREATE TRIGGER guard_tenant_platform_lifecycle
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION private.guard_tenant_platform_lifecycle();

COMMENT ON FUNCTION public.has_tenant_role(UUID,public.user_role[]) IS
  'Tenant role check. Legacy super_admin is deliberately excluded; Global Platform Owner is a separate identity and never a tenant membership.';
COMMENT ON FUNCTION private.guard_tenant_platform_lifecycle() IS
  'Prevents tenant administrators from self-activating, self-verifying, suspending, or rebinding tenant lifecycle state.';
