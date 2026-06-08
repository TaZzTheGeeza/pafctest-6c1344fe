ALTER TABLE public.tournament_matches ALTER COLUMN home_team_id DROP NOT NULL;
ALTER TABLE public.tournament_matches ALTER COLUMN away_team_id DROP NOT NULL;
ALTER TABLE public.tournament_matches ADD COLUMN IF NOT EXISTS home_placeholder text;
ALTER TABLE public.tournament_matches ADD COLUMN IF NOT EXISTS away_placeholder text;