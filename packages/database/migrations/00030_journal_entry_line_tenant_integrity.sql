-- MDI 00030: make journal entry lines tenant-aware and bind both parent records to one tenant.
ALTER TABLE public.journal_entry_lines
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

UPDATE public.journal_entry_lines AS line
SET tenant_id=entry.tenant_id
FROM public.journal_entries AS entry
WHERE entry.id=line.journal_entry_id
  AND line.tenant_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.journal_entry_lines WHERE tenant_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot infer tenant_id for every journal entry line';
  END IF;
END;
$$;

ALTER TABLE public.journal_entry_lines
  ALTER COLUMN tenant_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS journal_entries_tenant_id_id_uidx
  ON public.journal_entries(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_tenant_id_id_uidx
  ON public.accounts(tenant_id,id);
CREATE INDEX IF NOT EXISTS journal_entry_lines_tenant_journal_entry_idx
  ON public.journal_entry_lines(tenant_id,journal_entry_id);
CREATE INDEX IF NOT EXISTS journal_entry_lines_tenant_account_idx
  ON public.journal_entry_lines(tenant_id,account_id);

ALTER TABLE public.journal_entry_lines
  DROP CONSTRAINT IF EXISTS journal_entry_lines_journal_entry_id_fkey,
  DROP CONSTRAINT IF EXISTS journal_entry_lines_account_id_fkey;

ALTER TABLE public.journal_entry_lines
  ADD CONSTRAINT journal_entry_lines_journal_entry_tenant_fkey
    FOREIGN KEY (tenant_id,journal_entry_id)
    REFERENCES public.journal_entries(tenant_id,id)
    ON DELETE CASCADE NOT VALID,
  ADD CONSTRAINT journal_entry_lines_account_tenant_fkey
    FOREIGN KEY (tenant_id,account_id)
    REFERENCES public.accounts(tenant_id,id)
    ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.journal_entry_lines
  VALIDATE CONSTRAINT journal_entry_lines_journal_entry_tenant_fkey;
ALTER TABLE public.journal_entry_lines
  VALIDATE CONSTRAINT journal_entry_lines_account_tenant_fkey;

CREATE OR REPLACE FUNCTION private.set_journal_entry_line_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_entry_tenant UUID;
  v_account_tenant UUID;
BEGIN
  SELECT tenant_id INTO v_entry_tenant
  FROM public.journal_entries
  WHERE id=NEW.journal_entry_id;

  IF v_entry_tenant IS NULL THEN
    RAISE EXCEPTION 'journal_entry_not_found_or_not_visible';
  END IF;

  SELECT tenant_id INTO v_account_tenant
  FROM public.accounts
  WHERE id=NEW.account_id;

  IF v_account_tenant IS NULL OR v_account_tenant<>v_entry_tenant THEN
    RAISE EXCEPTION 'journal_account_must_belong_to_same_tenant' USING ERRCODE='23503';
  END IF;

  IF TG_OP='UPDATE' AND OLD.tenant_id IS NOT NULL AND OLD.tenant_id<>v_entry_tenant THEN
    RAISE EXCEPTION 'journal_entry_line_cannot_move_between_tenants' USING ERRCODE='42501';
  END IF;

  IF NEW.tenant_id IS NOT NULL AND NEW.tenant_id<>v_entry_tenant THEN
    RAISE EXCEPTION 'journal_entry_line_tenant_mismatch' USING ERRCODE='23503';
  END IF;

  NEW.tenant_id := v_entry_tenant;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.set_journal_entry_line_tenant() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS set_journal_entry_line_tenant ON public.journal_entry_lines;
CREATE TRIGGER set_journal_entry_line_tenant
BEFORE INSERT OR UPDATE OF journal_entry_id,account_id,tenant_id
ON public.journal_entry_lines
FOR EACH ROW EXECUTE FUNCTION private.set_journal_entry_line_tenant();

ALTER POLICY "Bursars and admins can manage journal entry lines"
ON public.journal_entry_lines
USING (public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role,'accountant'::public.user_role]))
WITH CHECK (public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role,'accountant'::public.user_role]));

ALTER POLICY "Journal entry lines viewable by bursars and admins"
ON public.journal_entry_lines
TO authenticated
USING (public.has_tenant_role(tenant_id,ARRAY['madrasa_admin'::public.user_role,'accountant'::public.user_role]));

COMMENT ON COLUMN public.journal_entry_lines.tenant_id IS
  'Tenant scope derived from the parent journal entry; composite FKs ensure the journal and account belong to the same tenant.';
