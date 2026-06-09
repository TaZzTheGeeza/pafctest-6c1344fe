
-- 1. Audit log table
CREATE TABLE public.tournament_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  actor_id UUID,
  old_row JSONB,
  new_row JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tournament_audit_created ON public.tournament_audit_log (created_at DESC);
CREATE INDEX idx_tournament_audit_table ON public.tournament_audit_log (table_name, created_at DESC);

GRANT SELECT ON public.tournament_audit_log TO authenticated;
GRANT ALL ON public.tournament_audit_log TO service_role;

ALTER TABLE public.tournament_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read tournament audit log"
  ON public.tournament_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_tournament_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    rec_id := (to_jsonb(OLD)->>'id')::uuid;
    INSERT INTO public.tournament_audit_log (table_name, record_id, operation, actor_id, old_row, new_row)
    VALUES (TG_TABLE_NAME, rec_id, 'DELETE', auth.uid(), to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    rec_id := (to_jsonb(NEW)->>'id')::uuid;
    INSERT INTO public.tournament_audit_log (table_name, record_id, operation, actor_id, old_row, new_row)
    VALUES (TG_TABLE_NAME, rec_id, 'UPDATE', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    rec_id := (to_jsonb(NEW)->>'id')::uuid;
    INSERT INTO public.tournament_audit_log (table_name, record_id, operation, actor_id, old_row, new_row)
    VALUES (TG_TABLE_NAME, rec_id, 'INSERT', auth.uid(), NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- 3. Attach triggers to the three tables
DROP TRIGGER IF EXISTS trg_audit_tournament_teams ON public.tournament_teams;
CREATE TRIGGER trg_audit_tournament_teams
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_teams
FOR EACH ROW EXECUTE FUNCTION public.log_tournament_change();

DROP TRIGGER IF EXISTS trg_audit_tournament_matches ON public.tournament_matches;
CREATE TRIGGER trg_audit_tournament_matches
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_matches
FOR EACH ROW EXECUTE FUNCTION public.log_tournament_change();

DROP TRIGGER IF EXISTS trg_audit_tournament_groups ON public.tournament_groups;
CREATE TRIGGER trg_audit_tournament_groups
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_groups
FOR EACH ROW EXECUTE FUNCTION public.log_tournament_change();

-- 4. Restore function: re-insert a deleted row from its snapshot
CREATE OR REPLACE FUNCTION public.restore_tournament_record(_log_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_row public.tournament_audit_log;
  result JSONB;
  match_log RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can restore tournament records';
  END IF;

  SELECT * INTO log_row FROM public.tournament_audit_log WHERE id = _log_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Audit entry not found';
  END IF;

  IF log_row.operation <> 'DELETE' THEN
    RAISE EXCEPTION 'Can only restore deleted records';
  END IF;

  IF log_row.table_name = 'tournament_teams' THEN
    INSERT INTO public.tournament_teams SELECT * FROM jsonb_populate_record(NULL::public.tournament_teams, log_row.old_row)
    ON CONFLICT (id) DO NOTHING;
    -- Also restore any matches that were deleted within 10 seconds before/after this team delete and reference this team
    FOR match_log IN
      SELECT * FROM public.tournament_audit_log
      WHERE table_name = 'tournament_matches'
        AND operation = 'DELETE'
        AND created_at BETWEEN log_row.created_at - interval '10 seconds' AND log_row.created_at + interval '10 seconds'
        AND ((old_row->>'home_team_id')::uuid = log_row.record_id OR (old_row->>'away_team_id')::uuid = log_row.record_id)
    LOOP
      INSERT INTO public.tournament_matches SELECT * FROM jsonb_populate_record(NULL::public.tournament_matches, match_log.old_row)
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
    result := jsonb_build_object('restored', 'team', 'id', log_row.record_id);
  ELSIF log_row.table_name = 'tournament_matches' THEN
    INSERT INTO public.tournament_matches SELECT * FROM jsonb_populate_record(NULL::public.tournament_matches, log_row.old_row)
    ON CONFLICT (id) DO NOTHING;
    result := jsonb_build_object('restored', 'match', 'id', log_row.record_id);
  ELSIF log_row.table_name = 'tournament_groups' THEN
    INSERT INTO public.tournament_groups SELECT * FROM jsonb_populate_record(NULL::public.tournament_groups, log_row.old_row)
    ON CONFLICT (id) DO NOTHING;
    result := jsonb_build_object('restored', 'group', 'id', log_row.record_id);
  ELSE
    RAISE EXCEPTION 'Unsupported table: %', log_row.table_name;
  END IF;

  RETURN result;
END;
$$;

-- 5. Prune helper (manual call; 90-day retention)
CREATE OR REPLACE FUNCTION public.prune_tournament_audit_log()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can prune the audit log';
  END IF;
  DELETE FROM public.tournament_audit_log WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
