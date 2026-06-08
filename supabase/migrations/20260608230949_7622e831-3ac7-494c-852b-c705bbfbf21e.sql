CREATE POLICY "Public can view confirmed tournament teams"
  ON public.tournament_teams
  FOR SELECT
  TO anon, authenticated
  USING (status = 'confirmed');

GRANT SELECT
  (id, age_group_id, team_name, club_name, county, status, group_id, player_count, team_category, league_division, created_at)
  ON public.tournament_teams TO anon, authenticated;

GRANT SELECT ON public.tournament_teams_public TO anon, authenticated;