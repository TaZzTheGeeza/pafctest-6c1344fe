ALTER TABLE public.tournament_matches ADD COLUMN IF NOT EXISTS referee text;
CREATE INDEX IF NOT EXISTS tournament_matches_referee_idx ON public.tournament_matches (referee);