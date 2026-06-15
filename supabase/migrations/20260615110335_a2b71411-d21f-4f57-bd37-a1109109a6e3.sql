GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_photos TO authenticated;
GRANT ALL ON public.tournament_photos TO service_role;
GRANT SELECT ON public.tournament_photos TO anon;