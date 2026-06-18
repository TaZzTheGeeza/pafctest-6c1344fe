
GRANT SELECT ON public.tournaments TO anon, authenticated;
GRANT SELECT ON public.tournament_age_groups TO anon, authenticated;
GRANT SELECT ON public.tournament_groups TO anon, authenticated;
GRANT SELECT ON public.tournament_teams TO anon, authenticated;
GRANT SELECT ON public.tournament_matches TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tournaments, public.tournament_age_groups, public.tournament_groups, public.tournament_teams, public.tournament_matches TO authenticated;
GRANT ALL ON public.tournaments, public.tournament_age_groups, public.tournament_groups, public.tournament_teams, public.tournament_matches TO service_role;
