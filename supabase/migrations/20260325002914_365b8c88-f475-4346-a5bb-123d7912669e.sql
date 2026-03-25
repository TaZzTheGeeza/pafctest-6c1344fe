
-- Add shirt_number to POTM table
ALTER TABLE public.player_of_the_match ADD COLUMN shirt_number integer;

-- Create match reports table
CREATE TABLE public.match_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  age_group text NOT NULL,
  opponent text NOT NULL,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  goal_scorers text,
  assists text,
  match_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.match_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view match reports" ON public.match_reports FOR SELECT TO public USING (true);
CREATE POLICY "Allow match report management" ON public.match_reports FOR ALL TO public USING (true) WITH CHECK (true);
