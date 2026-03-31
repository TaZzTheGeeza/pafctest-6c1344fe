UPDATE public.player_stats ps
SET
  goals = COALESCE(s.total_goals, 0),
  assists = COALESCE(s.total_assists, 0),
  appearances = COALESCE(s.total_apps, 0),
  potm_awards = COALESCE(s.total_potm, 0),
  updated_at = now()
FROM (
  SELECT player_stat_id,
    SUM(goals) as total_goals,
    SUM(assists) as total_assists,
    COUNT(*) FILTER (WHERE appeared) as total_apps,
    COUNT(*) FILTER (WHERE potm) as total_potm
  FROM public.match_player_stats
  GROUP BY player_stat_id
) s
WHERE ps.id = s.player_stat_id;