-- MDI 00014: allow the isolated Global Owner to inspect pending tenants and prevent duplicate requested identifiers.
CREATE UNIQUE INDEX IF NOT EXISTS madrasa_applications_requested_code_unique
  ON public.madrasa_applications (upper(requested_code))
  WHERE requested_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS madrasa_applications_requested_subdomain_unique
  ON public.madrasa_applications (lower(requested_subdomain))
  WHERE requested_subdomain IS NOT NULL;

DROP POLICY IF EXISTS "Global owner can inspect pending activation tenants" ON public.tenants;
CREATE POLICY "Global owner can inspect pending activation tenants"
ON public.tenants
FOR SELECT TO authenticated
USING (
  platform_status = 'pending_activation'
  AND (SELECT private.is_platform_owner())
);

COMMENT ON POLICY "Global owner can inspect pending activation tenants" ON public.tenants IS
  'Only the singleton Global Platform Owner with AAL2 can inspect tenants awaiting final activation.';
