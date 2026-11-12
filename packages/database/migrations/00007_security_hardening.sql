-- Migration 00007: close confirmed public data and authorization gaps.
-- Apply through the normal migration pipeline, first in a non-production project.
-- This is additive/reversible at the policy/function level; no table data is removed.

-- A public Sanad lookup must not grant direct reads of the full Sanad row.
DROP POLICY IF EXISTS "Sanads viewable by tenant members or public verified" ON public.sanads;
CREATE POLICY "Sanads viewable by tenant members"
ON public.sanads FOR SELECT TO authenticated
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));

-- Deliberately return only verification-safe fields. In particular, do not return
-- student names/admission numbers, the token, internal IDs, or signatory details.
CREATE OR REPLACE FUNCTION public.verify_sanad_public(p_token TEXT)
RETURNS TABLE (
    sanad_serial_no VARCHAR,
    title_bn VARCHAR,
    title_en VARCHAR,
    title_ar VARCHAR,
    result_dharja public.qawmi_dharja,
    gpa NUMERIC,
    issue_date DATE,
    sanad_status public.sanad_status,
    madrasa_name VARCHAR
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
    SELECT s.sanad_serial_no, s.title_bn, s.title_en, s.title_ar,
           s.result_dharja, s.gpa, s.issue_date, s.status, t.name
    FROM public.sanads AS s
    JOIN public.tenants AS t ON t.id = s.tenant_id
    WHERE p_token ~ '^[A-Fa-f0-9]{64}$'
      AND s.verification_hash = upper(p_token)
      AND s.status = 'issued'
    LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.verify_sanad_public(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_sanad_public(TEXT) TO anon, authenticated;

-- A Madrasa administrator may manage ordinary memberships, but cannot create or
-- promote a super administrator or another Madrasa administrator. Self-edits to
-- membership/role state are denied. A platform super administrator can manage roles.
CREATE OR REPLACE FUNCTION public.can_manage_tenant_membership(
    target_tenant_id UUID,
    target_role public.user_role
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
    SELECT public.has_tenant_role(
        target_tenant_id,
        ARRAY['super_admin'::public.user_role]
    ) OR (
        target_role IN (
            'academic_dean'::public.user_role,
            'teacher'::public.user_role,
            'student'::public.user_role,
            'parent'::public.user_role,
            'accountant'::public.user_role,
            'hostel_warden'::public.user_role
        )
        AND public.has_tenant_role(
            target_tenant_id,
            ARRAY['madrasa_admin'::public.user_role]
        )
    );
$$;
REVOKE ALL ON FUNCTION public.can_manage_tenant_membership(UUID, public.user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_tenant_membership(UUID, public.user_role) TO authenticated;

DROP POLICY IF EXISTS "Admins can manage tenant users" ON public.tenant_users;
CREATE POLICY "Tenant members can view memberships"
ON public.tenant_users FOR SELECT TO authenticated
USING (tenant_id IN (SELECT public.get_auth_tenant_ids()));
CREATE POLICY "Authorized admins can add permitted memberships"
ON public.tenant_users FOR INSERT TO authenticated
WITH CHECK (public.can_manage_tenant_membership(tenant_id, role));
CREATE POLICY "Authorized admins can update permitted memberships"
ON public.tenant_users FOR UPDATE TO authenticated
USING (user_id <> auth.uid() AND public.can_manage_tenant_membership(tenant_id, role))
WITH CHECK (user_id <> auth.uid() AND public.can_manage_tenant_membership(tenant_id, role));
CREATE POLICY "Authorized admins can remove permitted memberships"
ON public.tenant_users FOR DELETE TO authenticated
USING (user_id <> auth.uid() AND public.can_manage_tenant_membership(tenant_id, role));

-- Prevent role privilege changes even if another permissive policy is introduced
-- later. This trigger is defense in depth; table privileges and RLS still apply.
CREATE OR REPLACE FUNCTION public.guard_tenant_membership_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.user_id = auth.uid() THEN
        RAISE EXCEPTION 'Users cannot modify their own tenant membership';
    END IF;
    IF NOT public.can_manage_tenant_membership(NEW.tenant_id, NEW.role) THEN
        RAISE EXCEPTION 'Not authorized to assign this tenant role';
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_tenant_membership_privileges() FROM PUBLIC;
DROP TRIGGER IF EXISTS guard_tenant_membership_privileges ON public.tenant_users;
CREATE TRIGGER guard_tenant_membership_privileges
BEFORE INSERT OR UPDATE ON public.tenant_users
FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_membership_privileges();

-- Certificates and student documents are private. Public bucket access bypasses
-- object policies, so change bucket visibility as well as replacing broad policies.
UPDATE storage.buckets SET public = false
WHERE id IN ('sanad-documents', 'student-documents');
DROP POLICY IF EXISTS "Public Access for madrasa assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Admins Can Upload Assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant members can upload institution files" ON storage.objects;
DROP POLICY IF EXISTS "Tenant members can read private institution files" ON storage.objects;
DROP POLICY IF EXISTS "Tenant members can update institution files" ON storage.objects;
DROP POLICY IF EXISTS "Tenant members can delete institution files" ON storage.objects;

-- Public reads remain limited to the public-branding bucket. Files in private
-- buckets must use a signed URL after application-level authorization.
CREATE POLICY "Public read of madrasa branding assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'madrasa-assets');
CREATE POLICY "Tenant administrators upload institution files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id IN ('madrasa-assets', 'sanad-documents', 'student-documents')
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_tenant_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role]
    )
);
CREATE POLICY "Tenant administrators read private institution files"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id IN ('sanad-documents', 'student-documents')
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_tenant_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role]
    )
);
CREATE POLICY "Tenant administrators update institution files"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id IN ('madrasa-assets', 'sanad-documents', 'student-documents')
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_tenant_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role]
    )
)
WITH CHECK (
    bucket_id IN ('madrasa-assets', 'sanad-documents', 'student-documents')
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_tenant_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role]
    )
);
CREATE POLICY "Tenant administrators delete institution files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id IN ('madrasa-assets', 'sanad-documents', 'student-documents')
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_tenant_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['super_admin'::public.user_role, 'madrasa_admin'::public.user_role]
    )
);
