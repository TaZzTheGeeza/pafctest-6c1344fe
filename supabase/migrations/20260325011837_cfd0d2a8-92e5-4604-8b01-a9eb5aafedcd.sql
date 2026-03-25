CREATE TABLE public.player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  shirt_number integer,
  age_group text NOT NULL,
  team_name text NOT NULL,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  appearances integer NOT NULL DEFAULT 0,
  potm_awards integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player stats"
  ON public.player_stats FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Coaches and admins can manage player stats"
  ON public.player_stats FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));