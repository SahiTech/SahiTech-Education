-- MDI 00010: explicit least-privilege grants for platform workflow tables.
REVOKE ALL ON private.platform_owner FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.platform_owner TO service_role;

DROP POLICY IF EXISTS "Service role manages platform owner binding" ON private.platform_owner;
CREATE POLICY "Service role manages platform owner binding"
ON private.platform_owner
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

REVOKE ALL ON public.madrasa_applications FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.madrasa_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.madrasa_applications TO authenticated;

REVOKE ALL ON public.madrasa_application_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.madrasa_application_documents TO authenticated;
GRANT ALL ON public.madrasa_application_documents TO service_role;

REVOKE ALL ON public.platform_invitations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.platform_invitations TO authenticated;
GRANT ALL ON public.platform_invitations TO service_role;

REVOKE ALL ON public.email_outbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_outbox TO service_role;

DROP POLICY IF EXISTS "Service role manages email outbox" ON public.email_outbox;
CREATE POLICY "Service role manages email outbox"
ON public.email_outbox
FOR ALL TO service_role
USING (true)
WITH CHECK (true);
