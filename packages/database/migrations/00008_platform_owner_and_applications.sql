-- MDI 00008: isolated platform owner and public Madrasa application foundation.
-- Additive only. Does not modify legacy super_admin enum/memberships or tenant data.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE TABLE private.platform_owner (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    owner_email TEXT NOT NULL CHECK (owner_email = lower(btrim(owner_email))),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO private.platform_owner (singleton, owner_email)
VALUES (TRUE, 'helpline.sahitech@gmail.com');

ALTER TABLE private.platform_owner ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.platform_owner FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.platform_owner TO service_role;

CREATE OR REPLACE FUNCTION private.is_platform_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, private, auth, pg_temp
AS $$
    SELECT
      (SELECT auth.uid()) IS NOT NULL
      AND (SELECT auth.jwt() ->> 'aal') = 'aal2'
      AND EXISTS (
        SELECT 1
        FROM private.platform_owner AS owner_record
        WHERE owner_record.singleton = TRUE
          AND owner_record.auth_user_id = (SELECT auth.uid())
      );
$$;

REVOKE ALL ON FUNCTION private.is_platform_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_platform_owner() TO authenticated;

CREATE TABLE public.madrasa_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name TEXT NOT NULL CHECK (length(btrim(institution_name)) BETWEEN 2 AND 200),
    institution_name_bn TEXT,
    institution_type TEXT NOT NULL CHECK (institution_type IN ('qawmi', 'alia', 'hybrid')),
    board_affiliation TEXT,
    registration_number TEXT,
    established_year SMALLINT CHECK (established_year IS NULL OR established_year BETWEEN 1800 AND 2100),
    contact_person_name TEXT NOT NULL CHECK (length(btrim(contact_person_name)) BETWEEN 2 AND 160),
    contact_email TEXT NOT NULL CHECK (contact_email = lower(btrim(contact_email)) AND position('@' in contact_email) > 1),
    contact_phone TEXT NOT NULL CHECK (length(regexp_replace(contact_phone, '[^0-9+]', '', 'g')) BETWEEN 8 AND 18),
    division TEXT,
    district TEXT,
    address TEXT,
    website_url TEXT,
    application_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','under_review','info_requested','approved','rejected','withdrawn')),
    review_note TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
      (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
      OR status <> 'pending'
    )
);

CREATE INDEX madrasa_applications_status_submitted_idx
  ON public.madrasa_applications (status, submitted_at DESC);
CREATE INDEX madrasa_applications_contact_email_idx
  ON public.madrasa_applications (contact_email);

ALTER TABLE public.madrasa_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.madrasa_applications FROM PUBLIC;
GRANT INSERT ON public.madrasa_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.madrasa_applications TO authenticated;

CREATE POLICY "Public can submit pending Madrasa applications"
ON public.madrasa_applications
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND review_note IS NULL
);

CREATE POLICY "Global owner can review Madrasa applications"
ON public.madrasa_applications
FOR SELECT TO authenticated
USING ((SELECT private.is_platform_owner()));

CREATE POLICY "Global owner can update Madrasa application review"
ON public.madrasa_applications
FOR UPDATE TO authenticated
USING ((SELECT private.is_platform_owner()))
WITH CHECK (
  (SELECT private.is_platform_owner())
  AND status IN ('pending','under_review','info_requested','approved','rejected','withdrawn')
);

CREATE TABLE public.madrasa_application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.madrasa_applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('registration','board_affiliation','identity','authorization','other')),
    storage_object_path TEXT NOT NULL,
    original_file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (application_id, storage_object_path)
);

CREATE INDEX madrasa_application_documents_application_idx
  ON public.madrasa_application_documents (application_id);

ALTER TABLE public.madrasa_application_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.madrasa_application_documents FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.madrasa_application_documents TO authenticated;
GRANT ALL ON public.madrasa_application_documents TO service_role;

CREATE POLICY "Global owner can review application document metadata"
ON public.madrasa_application_documents
FOR SELECT TO authenticated
USING ((SELECT private.is_platform_owner()));

CREATE POLICY "Global owner can manage application document metadata"
ON public.madrasa_application_documents
FOR ALL TO authenticated
USING ((SELECT private.is_platform_owner()))
WITH CHECK ((SELECT private.is_platform_owner()));

CREATE TABLE public.platform_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL UNIQUE REFERENCES public.madrasa_applications(id) ON DELETE RESTRICT,
    invitee_email TEXT NOT NULL CHECK (invitee_email = lower(btrim(invitee_email))),
    token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','sent','accepted','expired','revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (expires_at > created_at)
);

CREATE INDEX platform_invitations_status_expiry_idx
  ON public.platform_invitations (status, expires_at);

ALTER TABLE public.platform_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_invitations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.platform_invitations TO authenticated;

CREATE POLICY "Global owner manages platform invitations"
ON public.platform_invitations
FOR ALL TO authenticated
USING ((SELECT private.is_platform_owner()))
WITH CHECK ((SELECT private.is_platform_owner()));

CREATE TABLE public.email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'queued'
      CHECK (status IN ('queued','processing','sent','failed','cancelled')),
    attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_outbox_ready_idx
  ON public.email_outbox (available_at, created_at)
  WHERE status IN ('queued','failed');

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_outbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_outbox TO service_role;

COMMENT ON TABLE private.platform_owner IS
  'Singleton platform owner binding. Never expose to tenant clients; auth_user_id is bound only by trusted server-side administration.';
COMMENT ON TABLE public.madrasa_applications IS
  'Public Madrasa applications. Public role may insert pending submissions only; review is restricted to the singleton Global Platform Owner.';
COMMENT ON TABLE public.platform_invitations IS
  'Single-use invitation metadata. Store only a SHA-256 hash of a cryptographically random token; never store the raw token.';
COMMENT ON TABLE public.email_outbox IS
  'Server-only transactional email outbox. Delivery is disabled until a verified Resend sender is configured.';
