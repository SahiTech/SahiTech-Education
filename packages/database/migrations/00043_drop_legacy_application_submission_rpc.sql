-- MDI 00043: retire the legacy application submission RPC.
-- The current web application uses the four-argument capability flow introduced
-- by migration 00039. The old two-argument overload does not issue a nonce-bound
-- upload capability and must not remain callable from the exposed public schema.

DROP FUNCTION IF EXISTS public.submit_madrasa_application(JSONB, TEXT);
