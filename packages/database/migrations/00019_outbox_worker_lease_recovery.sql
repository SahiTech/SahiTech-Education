-- MDI 00019: lease-based outbox recovery for workers interrupted mid-delivery.
CREATE OR REPLACE FUNCTION public.claim_email_outbox(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(id UUID,event_type TEXT,recipient_email TEXT,payload JSONB,attempts SMALLINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_limit < 1 OR p_limit > 50 THEN RAISE EXCEPTION 'invalid_batch_size'; END IF;

  UPDATE public.email_outbox
    SET status='failed',last_error='Processing lease expired after maximum attempts'
    WHERE status='processing' AND available_at<=now() AND attempts>=5;

  RETURN QUERY
  WITH picked AS (
    SELECT o.id
    FROM public.email_outbox o
    WHERE (
      (o.status IN ('queued','failed') AND o.available_at<=now() AND o.attempts<5)
      OR (o.status='processing' AND o.available_at<=now() AND o.attempts<5)
    )
    ORDER BY o.available_at,o.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.email_outbox o
    SET status='processing',
        attempts=o.attempts+1,
        available_at=now()+interval '10 minutes',
        last_error=NULL
    FROM picked
    WHERE o.id=picked.id
  RETURNING o.id,o.event_type,o.recipient_email,o.payload,o.attempts;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_email_outbox(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_outbox(INTEGER) TO service_role;
