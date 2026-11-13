-- MDI 00011: verified owner identity binding and document metadata least privilege.

REVOKE ALL ON public.madrasa_application_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.madrasa_application_documents TO authenticated;
GRANT ALL ON public.madrasa_application_documents TO service_role;

DROP POLICY IF EXISTS "Global owner can manage application document metadata" ON public.madrasa_application_documents;
DROP POLICY IF EXISTS "Global owner can review application document metadata" ON public.madrasa_application_documents;
CREATE POLICY "Global owner can review application document metadata"
ON public.madrasa_application_documents
FOR SELECT TO authenticated
USING ((SELECT private.is_platform_owner()));
CREATE POLICY "Global owner can update application document metadata"
ON public.madrasa_application_documents
FOR UPDATE TO authenticated
USING ((SELECT private.is_platform_owner()))
WITH CHECK ((SELECT private.is_platform_owner()));
CREATE POLICY "Global owner can delete application document metadata"
ON public.madrasa_application_documents
FOR DELETE TO authenticated
USING ((SELECT private.is_platform_owner()));

DROP POLICY IF EXISTS "Service role manages application document metadata" ON public.madrasa_application_documents;
CREATE POLICY "Service role manages application document metadata"
ON public.madrasa_application_documents
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION private.bind_verified_platform_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
DECLARE
  designated_email TEXT;
BEGIN
  SELECT owner_email INTO designated_email
  FROM private.platform_owner
  WHERE singleton = TRUE;

  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(btrim(COALESCE(NEW.email, ''))) = designated_email THEN
    UPDATE private.platform_owner
       SET auth_user_id = NEW.id,
           updated_at = now()
     WHERE singleton = TRUE
       AND (auth_user_id IS NULL OR auth_user_id = NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.bind_verified_platform_owner() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bind_verified_platform_owner ON auth.users;
CREATE TRIGGER bind_verified_platform_owner
AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.bind_verified_platform_owner();

CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
  SELECT private.is_platform_owner();
$$;

REVOKE ALL ON FUNCTION public.is_platform_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_owner() TO authenticated;

COMMENT ON FUNCTION private.bind_verified_platform_owner() IS
  'Binds the singleton Global Platform Owner only when the designated email has been verified in Supabase Auth; never replaces an existing binding.';
COMMENT ON FUNCTION public.is_platform_owner() IS
  'Returns true only for the bound singleton owner and an AAL2 session.';
