-- MDI 00045: consent-based newsletter subscriptions with double opt-in.
-- Raw confirmation and unsubscribe bearer tokens are never stored. Nonces and hashes only.
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL DEFAULT 'bn' CHECK (locale IN ('bn','en','ar')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','subscribed','unsubscribed')),
  confirmation_token_hash TEXT,
  confirmation_token_nonce TEXT,
  confirmation_expires_at TIMESTAMPTZ,
  unsubscribe_token_hash TEXT,
  unsubscribe_token_nonce TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  last_confirmation_requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_email_normalized CHECK (email_normalized = lower(btrim(email))),
  CONSTRAINT newsletter_confirmation_hash_format CHECK (confirmation_token_hash IS NULL OR confirmation_token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT newsletter_confirmation_nonce_format CHECK (confirmation_token_nonce IS NULL OR confirmation_token_nonce ~ '^[0-9a-f]{64}$'),
  CONSTRAINT newsletter_unsubscribe_hash_format CHECK (unsubscribe_token_hash IS NULL OR unsubscribe_token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT newsletter_unsubscribe_nonce_format CHECK (unsubscribe_token_nonce IS NULL OR unsubscribe_token_nonce ~ '^[0-9a-f]{64}$')
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_created_idx
  ON public.newsletter_subscribers(status, created_at DESC);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.newsletter_subscribers FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.newsletter_subscribers TO service_role;

CREATE OR REPLACE FUNCTION public.submit_newsletter_subscription(
  p_email TEXT,
  p_locale TEXT,
  p_confirmation_token_hash TEXT,
  p_confirmation_token_nonce TEXT,
  p_unsubscribe_token_hash TEXT,
  p_unsubscribe_token_nonce TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  v_email TEXT := lower(btrim(COALESCE(p_email,'')));
  v_existing public.newsletter_subscribers%ROWTYPE;
  v_subscriber_id UUID;
BEGIN
  IF length(v_email) > 254
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR p_locale NOT IN ('bn','en','ar')
     OR p_confirmation_token_hash !~ '^[0-9a-f]{64}$'
     OR p_confirmation_token_nonce !~ '^[0-9a-f]{64}$'
     OR p_unsubscribe_token_hash !~ '^[0-9a-f]{64}$'
     OR p_unsubscribe_token_nonce !~ '^[0-9a-f]{64}$'
  THEN
    RAISE EXCEPTION 'invalid_newsletter_subscription';
  END IF;

  SELECT * INTO v_existing
  FROM public.newsletter_subscribers
  WHERE email_normalized=v_email
  FOR UPDATE;

  IF FOUND AND v_existing.status='subscribed' THEN
    RETURN 'already_subscribed';
  END IF;

  IF FOUND AND v_existing.last_confirmation_requested_at > now()-interval '60 seconds' THEN
    RETURN 'pending';
  END IF;

  IF FOUND THEN
    UPDATE public.newsletter_subscribers
    SET email=v_email,
        locale=p_locale,
        status='pending',
        confirmation_token_hash=p_confirmation_token_hash,
        confirmation_token_nonce=p_confirmation_token_nonce,
        confirmation_expires_at=now()+interval '48 hours',
        unsubscribe_token_hash=p_unsubscribe_token_hash,
        unsubscribe_token_nonce=p_unsubscribe_token_nonce,
        consented_at=now(),
        confirmed_at=NULL,
        unsubscribed_at=NULL,
        last_confirmation_requested_at=now(),
        updated_at=now()
    WHERE id=v_existing.id
    RETURNING id INTO v_subscriber_id;
  ELSE
    INSERT INTO public.newsletter_subscribers(
      email,email_normalized,locale,status,
      confirmation_token_hash,confirmation_token_nonce,confirmation_expires_at,
      unsubscribe_token_hash,unsubscribe_token_nonce
    )
    VALUES(
      v_email,v_email,p_locale,'pending',
      p_confirmation_token_hash,p_confirmation_token_nonce,now()+interval '48 hours',
      p_unsubscribe_token_hash,p_unsubscribe_token_nonce
    )
    RETURNING id INTO v_subscriber_id;
  END IF;

  INSERT INTO public.email_outbox(event_type,recipient_email,payload)
  VALUES(
    'newsletter_confirmation',
    v_email,
    jsonb_build_object(
      'subscriber_id',v_subscriber_id,
      'locale',p_locale,
      'confirmation_token_nonce',p_confirmation_token_nonce,
      'confirmation_token_hash',p_confirmation_token_hash
    )
  );

  RETURN 'queued';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_newsletter_subscription(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_newsletter_subscription(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.confirm_newsletter_subscription(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9A-Fa-f]{64}$' THEN
    RETURN FALSE;
  END IF;

  v_hash := encode(extensions.digest(convert_to(upper(p_token),'UTF8'),'sha256'),'hex');

  UPDATE public.newsletter_subscribers
  SET status='subscribed',
      confirmed_at=now(),
      confirmation_token_hash=NULL,
      confirmation_token_nonce=NULL,
      confirmation_expires_at=NULL,
      updated_at=now()
  WHERE confirmation_token_hash=v_hash
    AND status='pending'
    AND confirmation_expires_at>now();

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_newsletter_subscription(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_newsletter_subscription(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter_subscription(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9A-Fa-f]{64}$' THEN
    RETURN FALSE;
  END IF;

  v_hash := encode(extensions.digest(convert_to(upper(p_token),'UTF8'),'sha256'),'hex');

  UPDATE public.newsletter_subscribers
  SET status='unsubscribed',
      unsubscribed_at=now(),
      updated_at=now()
  WHERE unsubscribe_token_hash=v_hash
    AND status IN ('pending','subscribed');

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_newsletter_subscription(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter_subscription(TEXT) TO anon, authenticated;

COMMENT ON TABLE public.newsletter_subscribers IS
  'Consent-based newsletter subscribers. Public clients may only use narrowly scoped subscription/confirmation RPCs; raw bearer tokens are never stored.';
