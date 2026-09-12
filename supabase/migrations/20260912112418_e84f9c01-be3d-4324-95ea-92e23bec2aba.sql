ALTER TABLE public.match_player_stats ADD COLUMN IF NOT EXISTS saves integer NOT NULL DEFAULT 0;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS saves integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.sync_player_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.player_stats
  SET
    goals = COALESCE((SELECT SUM(goals) FROM public.match_player_stats WHERE player_stat_id = COALESCE(NEW.player_stat_id, OLD.player_stat_id)), 0),
    assists = COALESCE((SELECT SUM(assists) FROM public.match_player_stats WHERE player_stat_id = COALESCE(NEW.player_stat_id, OLD.player_stat_id)), 0),
    saves = COALESCE((SELECT SUM(saves) FROM public.match_player_stats WHERE player_stat_id = COALESCE(NEW.player_stat_id, OLD.player_stat_id)), 0),
    appearances = COALESCE((SELECT COUNT(*) FROM public.match_player_stats WHERE player_stat_id = COALESCE(NEW.player_stat_id, OLD.player_stat_id) AND appeared = true), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.player_stat_id, OLD.player_stat_id);

  PERFORM public.recalc_potm_awards(COALESCE(NEW.player_stat_id, OLD.player_stat_id));
  RETURN COALESCE(NEW, OLD);
END;
$function$;