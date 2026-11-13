-- MDI 00029: prevent active SVG content in public branding assets.
UPDATE storage.buckets
SET allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'],
    file_size_limit=5242880
WHERE id='madrasa-assets';
