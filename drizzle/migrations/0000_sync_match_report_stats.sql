CREATE OR REPLACE FUNCTION public.apply_match_report_stats(_age_group text, _match_date date, _opponent text, _goals text, _assists text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _cag text := public.canonical_age_group(_age_group);
  _slug text;
  r record;
BEGIN
  IF _cag IS NULL THEN RETURN; END IF;
  _slug := lower(split_part(_cag,' ',1)) || 's' || CASE WHEN position(' ' in _cag) > 0 THEN '-' || lower(substr(_cag, position(' ' in _cag)+1)) ELSE '' END;

  CREATE TEMP TABLE IF NOT EXISTS _desired(pid uuid primary key, g int, a int) ON COMMIT DROP;
  DELETE FROM _desired;

  FOR r IN
    WITH tok AS (
      SELECT 'g' k, trim(t) t FROM unnest(string_to_array(coalesce(_goals,''), ',')) t
      UNION ALL SELECT 'a', trim(t) FROM unnest(string_to_array(coalesce(_assists,''), ',')) t
    ), p AS (
      SELECT k, coalesce((regexp_match(t,'^(.*?)\s*[x×]\s*(\d+)$'))[1], t) nm,
             coalesce((regexp_match(t,'^(.*?)\s*[x×]\s*(\d+)$'))[2]::int, 1) cnt
      FROM tok WHERE t <> ''
    )
    SELECT p.k, p.cnt, (SELECT ps.id FROM public.player_stats ps
        WHERE public.canonical_age_group(ps.age_group) = _cag AND lower(trim(ps.first_name)) = lower(trim(p.nm))
        LIMIT 1) pid
    FROM p
  LOOP
    IF r.pid IS NOT NULL THEN
      INSERT INTO _desired VALUES (r.pid, CASE WHEN r.k='g' THEN r.cnt ELSE 0 END, CASE WHEN r.k='a' THEN r.cnt ELSE 0 END)
      ON CONFLICT (pid) DO UPDATE SET g = _desired.g + EXCLUDED.g, a = _desired.a + EXCLUDED.a;
    END IF;
  END LOOP;

  -- Reset existing rows for this team/date to what the report says
  UPDATE public.match_player_stats m
  SET goals = coalesce(d.g, 0), assists = coalesce(d.a, 0)
  FROM public.player_stats ps LEFT JOIN _desired d ON d.pid = ps.id
  WHERE m.player_stat_id = ps.id AND m.match_date = _match_date
    AND public.canonical_age_group(ps.age_group) = _cag
    AND (m.goals IS DISTINCT FROM coalesce(d.g,0) OR m.assists IS DISTINCT FROM coalesce(d.a,0));

  INSERT INTO public.match_player_stats (player_stat_id, team_slug, match_date, opponent, goals, assists)
  SELECT d.pid, _slug, _match_date, _opponent, d.g, d.a FROM _desired d
  WHERE NOT EXISTS (SELECT 1 FROM public.match_player_stats m WHERE m.player_stat_id = d.pid AND m.match_date = _match_date);
END; $$;

CREATE OR REPLACE FUNCTION public.sync_match_report_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    PERFORM public.apply_match_report_stats(OLD.age_group, OLD.match_date, OLD.opponent, NULL, NULL);
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    PERFORM public.apply_match_report_stats(NEW.age_group, NEW.match_date, NEW.opponent, NEW.goal_scorers, NEW.assists);
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_sync_match_report_stats ON public.match_reports;
CREATE TRIGGER trg_sync_match_report_stats
AFTER INSERT OR DELETE OR UPDATE OF goal_scorers, assists, match_date, age_group, opponent ON public.match_reports
FOR EACH ROW EXECUTE FUNCTION public.sync_match_report_stats();

-- Tidy one free-text scorer entry
UPDATE public.match_reports SET goal_scorers = 'Harvey x3, Joe, Braidon'
WHERE goal_scorers = 'Harvey 3 Joe 1 braidon 1';

-- Backfill every existing report
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT * FROM public.match_reports LOOP
    PERFORM public.apply_match_report_stats(r.age_group, r.match_date, r.opponent, r.goal_scorers, r.assists);
  END LOOP;
END $$;

-- Final totals: goals & assists always equal the sum of match records
UPDATE public.player_stats ps SET
  goals = coalesce((SELECT sum(goals) FROM public.match_player_stats m WHERE m.player_stat_id = ps.id),0),
  assists = coalesce((SELECT sum(assists) FROM public.match_player_stats m WHERE m.player_stat_id = ps.id),0),
  updated_at = now();