
DROP POLICY IF EXISTS "Anon can read just-inserted team" ON public.tournament_teams;
DROP POLICY IF EXISTS "Authenticated users can view basic team info" ON public.tournament_teams;

DROP POLICY IF EXISTS "Anyone can view tournament photos" ON public.tournament_photos;

CREATE OR REPLACE VIEW public.tournament_photos_public
WITH (security_invoker = false) AS
SELECT id, tournament_id, age_group, caption, preview_url, price_cents, created_at
FROM public.tournament_photos;

GRANT SELECT ON public.tournament_photos_public TO anon, authenticated;
