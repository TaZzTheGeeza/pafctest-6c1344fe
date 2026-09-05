
CREATE OR REPLACE FUNCTION public.recalc_potm_awards(_player_stat_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ps public.player_stats%ROWTYPE;
  _count integer;
BEGIN
  SELECT * INTO _ps FROM public.player_stats WHERE id = _player_stat_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COUNT(*) INTO _count FROM (
    SELECT mps.match_date AS d
    FROM public.match_player_stats mps
    WHERE mps.player_stat_id = _ps.id AND mps.potm = true
    UNION
    SELECT potm.award_date AS d
    FROM public.player_of_the_match potm
    WHERE public.canonical_age_group(potm.age_group) = public.canonical_age_group(_ps.age_group)
      AND lower(split_part(trim(potm.player_name), ' ', 1)) = lower(trim(_ps.first_name))
      AND (
        potm.shirt_number IS NULL
        OR _ps.shirt_number IS NULL
        OR potm.shirt_number = _ps.shirt_number
      )
  ) t;

  UPDATE public.player_stats
  SET potm_awards = COALESCE(_count, 0), updated_at = now()
  WHERE id = _ps.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_player_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.player_stats
  SET
    goals = COALESCE((SELECT SUM(goals) FROM public.match_player_stats WHERE player_stat_id = COALESCE(NEW.player_stat_id, OLD.player_stat_id)), 0),
    assists = COALESCE((SELECT SUM(assists) FROM public.match_player_stats WHERE player_stat_id = COALESCE(NEW.player_stat_id, OLD.player_stat_id)), 0),
    appearances = COALESCE((SELECT COUNT(*) FROM public.match_player_stats WHERE player_stat_id = COALESCE(NEW.player_stat_id, OLD.player_stat_id) AND appeared = true), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.player_stat_id, OLD.player_stat_id);

  PERFORM public.recalc_potm_awards(COALESCE(NEW.player_stat_id, OLD.player_stat_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_potm_awards_from_award()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT ps.id FROM public.player_stats ps
    WHERE public.canonical_age_group(ps.age_group) IN (
      public.canonical_age_group(COALESCE(NEW.age_group, '')),
      public.canonical_age_group(COALESCE(OLD.age_group, ''))
    )
    AND lower(trim(ps.first_name)) IN (
      lower(split_part(trim(COALESCE(NEW.player_name, '')), ' ', 1)),
      lower(split_part(trim(COALESCE(OLD.player_name, '')), ' ', 1))
    )
  LOOP
    PERFORM public.recalc_potm_awards(r.id);
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_potm_awards ON public.player_of_the_match;
CREATE TRIGGER trg_sync_potm_awards
AFTER INSERT OR UPDATE OR DELETE ON public.player_of_the_match
FOR EACH ROW EXECUTE FUNCTION public.sync_potm_awards_from_award();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.player_stats LOOP
    PERFORM public.recalc_potm_awards(r.id);
  END LOOP;
END $$;
