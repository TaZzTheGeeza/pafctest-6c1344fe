WITH ranked AS (
  SELECT id, pitch,
    ROW_NUMBER() OVER (PARTITION BY pitch ORDER BY match_time) - 1 AS idx,
    MIN(match_time) OVER (PARTITION BY pitch) AS first_time
  FROM public.tournament_matches
)
UPDATE public.tournament_matches m
SET match_time = r.first_time + (r.idx * interval '20 minutes'),
    pitch = REPLACE(REPLACE(REPLACE(REPLACE(m.pitch,
      'Pitch A', 'Pitch 1'),
      'Pitch B', 'Pitch 2'),
      'Pitch C', 'Pitch 3'),
      'Pitch D', 'Pitch 4')
FROM ranked r
WHERE m.id = r.id;