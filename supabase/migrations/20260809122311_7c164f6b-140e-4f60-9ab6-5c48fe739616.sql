REVOKE SELECT ON public.tournament_teams FROM anon, authenticated;

GRANT SELECT (
  id, age_group_id, team_name, manager_name, player_count, status, group_id, created_at,
  club_name, county, club_org_id, secretary_name, league_division, team_category,
  consent_rules, consent_photography, manual_played, manual_won, manual_drawn, manual_lost,
  manual_gf, manual_ga, manual_points
) ON public.tournament_teams TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.tournament_teams TO authenticated;
GRANT ALL ON public.tournament_teams TO service_role;