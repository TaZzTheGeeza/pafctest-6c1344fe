-- Revert tournament age groups, photos, and team names to pre-season-bump values.
-- The 2026/27 season bump should not have applied to tournament data.

UPDATE public.tournament_age_groups
SET age_group = CASE age_group
    WHEN 'U7' THEN 'U6'
    WHEN 'U8' THEN 'U7'
    WHEN 'U9' THEN 'U8'
    WHEN 'U9 Black' THEN 'U8 Black'
    WHEN 'U9 Gold'  THEN 'U8 Gold'
    WHEN 'U10' THEN 'U9'
    WHEN 'U11' THEN 'U10'
    WHEN 'U12' THEN 'U11'
    WHEN 'U12 Black' THEN 'U11 Black'
    WHEN 'U12 Gold'  THEN 'U11 Gold'
    WHEN 'U14' THEN 'U13'
    WHEN 'U14 Black' THEN 'U13 Black'
    WHEN 'U14 Gold'  THEN 'U13 Gold'
    WHEN 'U15' THEN 'U14'
    ELSE age_group END
WHERE age_group IS NOT NULL;

UPDATE public.tournament_photos
SET age_group = CASE age_group
    WHEN 'U7' THEN 'U6'
    WHEN 'U8' THEN 'U7'
    WHEN 'U9' THEN 'U8'
    WHEN 'U9 Black' THEN 'U8 Black'
    WHEN 'U9 Gold'  THEN 'U8 Gold'
    WHEN 'U10' THEN 'U9'
    WHEN 'U11' THEN 'U10'
    WHEN 'U12' THEN 'U11'
    WHEN 'U12 Black' THEN 'U11 Black'
    WHEN 'U12 Gold'  THEN 'U11 Gold'
    WHEN 'U14' THEN 'U13'
    WHEN 'U14 Black' THEN 'U13 Black'
    WHEN 'U14 Gold'  THEN 'U13 Gold'
    WHEN 'U15' THEN 'U14'
    ELSE age_group END
WHERE age_group IS NOT NULL;

-- Reverse team_name substitutions in tournament_teams.
-- Do compound (Black/Gold) replacements first to avoid clobbering by the plain regex passes.
UPDATE public.tournament_teams
SET team_name = REPLACE(team_name, 'U9 Black', 'U8 Black')
WHERE team_name LIKE '%U9 Black%';
UPDATE public.tournament_teams
SET team_name = REPLACE(team_name, 'U9 Gold', 'U8 Gold')
WHERE team_name LIKE '%U9 Gold%';
UPDATE public.tournament_teams
SET team_name = REPLACE(team_name, 'U12 Black', 'U11 Black')
WHERE team_name LIKE '%U12 Black%';
UPDATE public.tournament_teams
SET team_name = REPLACE(team_name, 'U12 Gold', 'U11 Gold')
WHERE team_name LIKE '%U12 Gold%';
UPDATE public.tournament_teams
SET team_name = REPLACE(team_name, 'U14 Black', 'U13 Black')
WHERE team_name LIKE '%U14 Black%';
UPDATE public.tournament_teams
SET team_name = REPLACE(team_name, 'U14 Gold', 'U13 Gold')
WHERE team_name LIKE '%U14 Gold%';

-- Now reverse plain age tokens (word-boundary regex). Order matters: shrink from highest first.
UPDATE public.tournament_teams
SET team_name = regexp_replace(team_name, '\mU15\M', 'U14', 'g')
WHERE team_name ~ '\mU15\M';
UPDATE public.tournament_teams
SET team_name = regexp_replace(team_name, '\mU14\M', 'U13', 'g')
WHERE team_name ~ '\mU14\M';
UPDATE public.tournament_teams
SET team_name = regexp_replace(team_name, '\mU12\M', 'U11', 'g')
WHERE team_name ~ '\mU12\M';
UPDATE public.tournament_teams
SET team_name = regexp_replace(team_name, '\mU11\M', 'U10', 'g')
WHERE team_name ~ '\mU11\M';
UPDATE public.tournament_teams
SET team_name = regexp_replace(team_name, '\mU10\M', 'U9', 'g')
WHERE team_name ~ '\mU10\M';
UPDATE public.tournament_teams
SET team_name = regexp_replace(team_name, '\mU9\M', 'U8', 'g')
WHERE team_name ~ '\mU9\M';
UPDATE public.tournament_teams
SET team_name = regexp_replace(team_name, '\mU8\M', 'U7', 'g')
WHERE team_name ~ '\mU8\M';
UPDATE public.tournament_teams
SET team_name = regexp_replace(team_name, '\mU7\M', 'U6', 'g')
WHERE team_name ~ '\mU7\M';