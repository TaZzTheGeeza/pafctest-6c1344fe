-- Create history table for match reports
CREATE TABLE public.match_reports_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_match_report_id uuid,
  season text NOT NULL,
  team_name text NOT NULL,
  age_group text NOT NULL,
  opponent text NOT NULL,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  match_date date NOT NULL,
  goal_scorers text,
  assists text,
  notes text,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.match_reports_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_reports_history TO authenticated;
GRANT ALL ON public.match_reports_history TO service_role;

ALTER TABLE public.match_reports_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match reports history"
ON public.match_reports_history FOR SELECT
USING (true);

CREATE POLICY "Admins can manage match reports history"
ON public.match_reports_history FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Archive current match reports to 2025/26 season
INSERT INTO public.match_reports_history
  (original_match_report_id, season, team_name, age_group, opponent, home_score, away_score, match_date, goal_scorers, assists, notes, created_at)
SELECT id, '2025/26', team_name, age_group, opponent, home_score, away_score, match_date, goal_scorers, assists, notes, created_at
FROM public.match_reports;

-- Wipe current match reports for new season
DELETE FROM public.match_reports;