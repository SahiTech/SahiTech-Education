-- MDI 00016: allow safe invitation re-issue while enforcing one active invitation per application.
ALTER TABLE public.platform_invitations
  DROP CONSTRAINT IF EXISTS platform_invitations_application_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS platform_invitations_one_active_per_application
  ON public.platform_invitations(application_id)
  WHERE status IN ('pending','sent');
