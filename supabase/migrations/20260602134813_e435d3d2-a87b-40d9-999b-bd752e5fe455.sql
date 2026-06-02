
CREATE TABLE public.player_stats_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_player_stat_id uuid,
  season text NOT NULL,
  first_name text NOT NULL,
  shirt_number integer,
  age_group text NOT NULL,
  team_name text NOT NULL,
  position text,
  photo_url text,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  appearances integer NOT NULL DEFAULT 0,
  potm_awards integer NOT NULL DEFAULT 0,
  archived_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.player_stats_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_stats_history TO authenticated;
GRANT ALL ON public.player_stats_history TO service_role;

ALTER TABLE public.player_stats_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stats history"
  ON public.player_stats_history FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stats history"
  ON public.player_stats_history FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_player_stats_history_season_age ON public.player_stats_history(season, age_group);


CREATE TABLE public.match_player_stats_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season text NOT NULL,
  original_player_stat_id uuid,
  history_player_stat_id uuid REFERENCES public.player_stats_history(id) ON DELETE CASCADE,
  team_slug text NOT NULL,
  opponent text NOT NULL,
  match_date date NOT NULL,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  appeared boolean NOT NULL DEFAULT false,
  potm boolean NOT NULL DEFAULT false,
  archived_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.match_player_stats_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_player_stats_history TO authenticated;
GRANT ALL ON public.match_player_stats_history TO service_role;

ALTER TABLE public.match_player_stats_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match stats history"
  ON public.match_player_stats_history FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage match stats history"
  ON public.match_player_stats_history FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
