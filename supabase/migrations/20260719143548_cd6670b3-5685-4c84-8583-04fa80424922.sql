
-- 1) Switch tournament_photos_public view to SECURITY INVOKER
ALTER VIEW public.tournament_photos_public SET (security_invoker = on);

-- Allow public read on tournament_photos base (column privileges restrict fields)
DROP POLICY IF EXISTS "Public can view tournament photos" ON public.tournament_photos;
CREATE POLICY "Public can view tournament photos"
  ON public.tournament_photos
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE SELECT ON public.tournament_photos FROM anon, authenticated;
GRANT SELECT
  (id, tournament_id, age_group, caption, preview_url, price_cents,
   created_at, photo_date, featured, featured_at, photo_ref)
  ON public.tournament_photos TO anon, authenticated;
GRANT SELECT ON public.tournament_photos TO service_role;

-- 2) Restrict tournament_teams public exposure to non-contact columns
REVOKE SELECT ON public.tournament_teams FROM anon, authenticated;
GRANT SELECT
  (id, age_group_id, team_name, club_name, county, status, group_id,
   player_count, team_category, league_division, created_at, club_org_id,
   consent_rules, consent_photography)
  ON public.tournament_teams TO anon, authenticated;
GRANT SELECT ON public.tournament_teams TO service_role;
