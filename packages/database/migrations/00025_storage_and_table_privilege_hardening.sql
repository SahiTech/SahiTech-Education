-- MDI 00025: close broad table-level bypass privileges and tenant-scope Storage writes.
REVOKE TRUNCATE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA public
FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Tenant Admins Can Upload Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for madrasa assets" ON storage.objects;

CREATE POLICY "Public can read Madrasa branding assets"
ON storage.objects
FOR SELECT TO public
USING (bucket_id='madrasa-assets');

CREATE POLICY "Madrasa admins can upload within their own asset namespace"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id='madrasa-assets'
  AND array_length(storage.foldername(name),1) >= 1
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.has_tenant_role(
    ((storage.foldername(name))[1])::UUID,
    ARRAY['madrasa_admin'::public.user_role]
  )
);

UPDATE storage.buckets
SET public=FALSE
WHERE id IN ('sanad-documents','student-documents');

COMMENT ON POLICY "Madrasa admins can upload within their own asset namespace" ON storage.objects IS
  'Only an active Madrasa Admin may upload branding assets beneath a folder named for their own tenant UUID. Sensitive student and Sanad document buckets have no broad client upload policy.';
