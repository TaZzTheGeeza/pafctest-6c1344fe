CREATE OR REPLACE FUNCTION public.restore_tournament_record(_log_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- DELETE: re-insert the deleted row (and cascade-deleted matches if a team)
  IF log_row.operation = 'DELETE' THEN
    IF log_row.table_name = 'tournament_teams' THEN
      INSERT INTO public.tournament_teams SELECT * FROM jsonb_populate_record(NULL::public.tournament_teams, log_row.old_row)
      ON CONFLICT (id) DO NOTHING;
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

  -- UPDATE: revert row to old_row values
  ELSIF log_row.operation = 'UPDATE' THEN
    IF log_row.table_name = 'tournament_teams' THEN
      DELETE FROM public.tournament_teams WHERE id = log_row.record_id;
      INSERT INTO public.tournament_teams SELECT * FROM jsonb_populate_record(NULL::public.tournament_teams, log_row.old_row);
      result := jsonb_build_object('reverted', 'team', 'id', log_row.record_id);
    ELSIF log_row.table_name = 'tournament_matches' THEN
      DELETE FROM public.tournament_matches WHERE id = log_row.record_id;
      INSERT INTO public.tournament_matches SELECT * FROM jsonb_populate_record(NULL::public.tournament_matches, log_row.old_row);
      result := jsonb_build_object('reverted', 'match', 'id', log_row.record_id);
    ELSIF log_row.table_name = 'tournament_groups' THEN
      DELETE FROM public.tournament_groups WHERE id = log_row.record_id;
      INSERT INTO public.tournament_groups SELECT * FROM jsonb_populate_record(NULL::public.tournament_groups, log_row.old_row);
      result := jsonb_build_object('reverted', 'group', 'id', log_row.record_id);
    ELSE
      RAISE EXCEPTION 'Unsupported table: %', log_row.table_name;
    END IF;

  -- INSERT: undo by deleting the created row
  ELSIF log_row.operation = 'INSERT' THEN
    IF log_row.table_name = 'tournament_teams' THEN
      DELETE FROM public.tournament_teams WHERE id = log_row.record_id;
    ELSIF log_row.table_name = 'tournament_matches' THEN
      DELETE FROM public.tournament_matches WHERE id = log_row.record_id;
    ELSIF log_row.table_name = 'tournament_groups' THEN
      DELETE FROM public.tournament_groups WHERE id = log_row.record_id;
    ELSE
      RAISE EXCEPTION 'Unsupported table: %', log_row.table_name;
    END IF;
    result := jsonb_build_object('undone', 'insert', 'id', log_row.record_id);
  END IF;

  RETURN result;
END;
$function$;