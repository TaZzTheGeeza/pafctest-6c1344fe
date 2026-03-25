
-- Per-match player stats for granular season tracking
CREATE TABLE public.match_player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_stat_id uuid REFERENCES public.player_stats(id) ON DELETE CASCADE NOT NULL,
  team_slug text NOT NULL,
  match_date date NOT NULL,
  opponent text NOT NULL,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  appeared boolean NOT NULL DEFAULT false,
  potm boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one entry per player per match
ALTER TABLE public.match_player_stats 
  ADD CONSTRAINT unique_player_match UNIQUE (player_stat_id, match_date, opponent);

-- RLS
ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match player stats"
  ON public.match_player_stats FOR SELECT
  TO public USING (true);

CREATE POLICY "Coaches and admins can manage match player stats"
  ON public.match_player_stats FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Function to recalculate player_stats totals from match_player_stats
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
    potm_awards = COALESCE((SELECT COUNT(*) FROM public.match_player_stats WHERE player_stat_id = COALESCE(NEW.player_stat_id, OLD.player_stat_id) AND potm = true), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.player_stat_id, OLD.player_stat_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to auto-sync totals
CREATE TRIGGER sync_player_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.match_player_stats
  FOR EACH ROW EXECUTE FUNCTION public.sync_player_stats();
