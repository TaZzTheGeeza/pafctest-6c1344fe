
-- =====================================================================
-- PRE-DEDUPE: drop OLD-label rows that would collide with NEW-label rows
-- =====================================================================

-- user_age_groups (UNIQUE user_id, age_group)
DELETE FROM public.user_age_groups uag
WHERE EXISTS (
  SELECT 1 FROM public.user_age_groups other
  WHERE other.user_id = uag.user_id
    AND other.age_group = CASE uag.age_group
        WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
        WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
        WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
        WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
        WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
        WHEN 'U14' THEN 'U15'
        ELSE NULL END
    AND other.id <> uag.id
);

-- team_members (UNIQUE user_id, team_slug)
DELETE FROM public.team_members tm
WHERE EXISTS (
  SELECT 1 FROM public.team_members other
  WHERE other.user_id = tm.user_id
    AND other.team_slug = CASE tm.team_slug
        WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
        WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
        WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
        WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
        WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
        WHEN 'u14s' THEN 'u15s'
        ELSE NULL END
    AND other.id <> tm.id
);

-- team_invites (UNIQUE email, team_slug)
DELETE FROM public.team_invites ti
WHERE EXISTS (
  SELECT 1 FROM public.team_invites other
  WHERE other.email = ti.email
    AND other.team_slug = CASE ti.team_slug
        WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
        WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
        WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
        WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
        WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
        WHEN 'u14s' THEN 'u15s'
        ELSE NULL END
    AND other.id <> ti.id
);

-- presentation_award_settings (UNIQUE team_slug, award_type)
DELETE FROM public.presentation_award_settings pas
WHERE EXISTS (
  SELECT 1 FROM public.presentation_award_settings other
  WHERE other.award_type = pas.award_type
    AND other.team_slug = CASE pas.team_slug
        WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
        WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
        WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
        WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
        WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
        WHEN 'u14s' THEN 'u15s'
        ELSE NULL END
    AND other.id <> pas.id
);

-- =====================================================================
-- 1. Canonical helper functions
-- =====================================================================
CREATE OR REPLACE FUNCTION public.canonical_team_slug(_slug text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $function$
  SELECT CASE lower(trim(coalesce(_slug, '')))
    WHEN 'u6' THEN 'u6s' WHEN 'u6s' THEN 'u6s'
    WHEN 'u7' THEN 'u7s' WHEN 'u7s' THEN 'u7s'
    WHEN 'u8' THEN 'u8s' WHEN 'u8s' THEN 'u8s'
    WHEN 'u9' THEN 'u9s' WHEN 'u9s' THEN 'u9s'
    WHEN 'u9-black' THEN 'u9s-black' WHEN 'u9s-black' THEN 'u9s-black'
    WHEN 'u9-gold' THEN 'u9s-gold' WHEN 'u9s-gold' THEN 'u9s-gold'
    WHEN 'u10' THEN 'u10s' WHEN 'u10s' THEN 'u10s'
    WHEN 'u11' THEN 'u11s' WHEN 'u11s' THEN 'u11s'
    WHEN 'u11-black' THEN 'u11s-black' WHEN 'u11s-black' THEN 'u11s-black'
    WHEN 'u11-gold' THEN 'u11s-gold' WHEN 'u11s-gold' THEN 'u11s-gold'
    WHEN 'u12-black' THEN 'u12s-black' WHEN 'u12s-black' THEN 'u12s-black'
    WHEN 'u12-gold' THEN 'u12s-gold' WHEN 'u12s-gold' THEN 'u12s-gold'
    WHEN 'u13' THEN 'u13s' WHEN 'u13s' THEN 'u13s'
    WHEN 'u13-black' THEN 'u13s-black' WHEN 'u13s-black' THEN 'u13s-black'
    WHEN 'u13-gold' THEN 'u13s-gold' WHEN 'u13s-gold' THEN 'u13s-gold'
    WHEN 'u14' THEN 'u14s' WHEN 'u14s' THEN 'u14s'
    WHEN 'u14-black' THEN 'u14s-black' WHEN 'u14s-black' THEN 'u14s-black'
    WHEN 'u14-gold' THEN 'u14s-gold' WHEN 'u14s-gold' THEN 'u14s-gold'
    WHEN 'u15' THEN 'u15s' WHEN 'u15s' THEN 'u15s'
    ELSE lower(trim(coalesce(_slug, '')))
  END
$function$;

CREATE OR REPLACE FUNCTION public.canonical_age_group(_value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $function$
  SELECT CASE public.canonical_team_slug(_value)
    WHEN 'u6s' THEN 'U6' WHEN 'u7s' THEN 'U7' WHEN 'u8s' THEN 'U8'
    WHEN 'u9s' THEN 'U9' WHEN 'u9s-black' THEN 'U9 Black' WHEN 'u9s-gold' THEN 'U9 Gold'
    WHEN 'u10s' THEN 'U10' WHEN 'u11s' THEN 'U11'
    WHEN 'u11s-black' THEN 'U11 Black' WHEN 'u11s-gold' THEN 'U11 Gold'
    WHEN 'u12s-black' THEN 'U12 Black' WHEN 'u12s-gold' THEN 'U12 Gold'
    WHEN 'u13s' THEN 'U13' WHEN 'u13s-black' THEN 'U13 Black' WHEN 'u13s-gold' THEN 'U13 Gold'
    WHEN 'u14s' THEN 'U14' WHEN 'u14s-black' THEN 'U14 Black' WHEN 'u14s-gold' THEN 'U14 Gold'
    WHEN 'u15s' THEN 'U15'
    ELSE trim(coalesce(_value, ''))
  END
$function$;

-- =====================================================================
-- 2. AGE-GROUP LABEL UPDATES (pretty form)
-- =====================================================================

UPDATE public.player_stats
SET age_group = CASE age_group
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15' ELSE age_group END,
  team_name = CASE
    WHEN team_name LIKE '%U8 Black%' THEN REPLACE(team_name, 'U8 Black', 'U9 Black')
    WHEN team_name LIKE '%U8 Gold%'  THEN REPLACE(team_name, 'U8 Gold',  'U9 Gold')
    WHEN team_name LIKE '%U11 Black%' THEN REPLACE(team_name, 'U11 Black', 'U12 Black')
    WHEN team_name LIKE '%U11 Gold%'  THEN REPLACE(team_name, 'U11 Gold',  'U12 Gold')
    WHEN team_name LIKE '%U13 Black%' THEN REPLACE(team_name, 'U13 Black', 'U14 Black')
    WHEN team_name LIKE '%U13 Gold%'  THEN REPLACE(team_name, 'U13 Gold',  'U14 Gold')
    WHEN team_name ~ '\mU14\M' THEN regexp_replace(team_name, '\mU14\M', 'U15')
    WHEN team_name ~ '\mU10\M' THEN regexp_replace(team_name, '\mU10\M', 'U11')
    WHEN team_name ~ '\mU9\M'  THEN regexp_replace(team_name, '\mU9\M',  'U10')
    WHEN team_name ~ '\mU7\M'  THEN regexp_replace(team_name, '\mU7\M',  'U8')
    WHEN team_name ~ '\mU6\M'  THEN regexp_replace(team_name, '\mU6\M',  'U7')
    ELSE team_name END;

UPDATE public.user_age_groups
SET age_group = CASE age_group
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15' ELSE age_group END;

UPDATE public.match_reports
SET age_group = CASE age_group
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15' ELSE age_group END,
  team_name = CASE
    WHEN team_name LIKE '%U8 Black%' THEN REPLACE(team_name, 'U8 Black', 'U9 Black')
    WHEN team_name LIKE '%U8 Gold%'  THEN REPLACE(team_name, 'U8 Gold',  'U9 Gold')
    WHEN team_name LIKE '%U11 Black%' THEN REPLACE(team_name, 'U11 Black', 'U12 Black')
    WHEN team_name LIKE '%U11 Gold%'  THEN REPLACE(team_name, 'U11 Gold',  'U12 Gold')
    WHEN team_name LIKE '%U13 Black%' THEN REPLACE(team_name, 'U13 Black', 'U14 Black')
    WHEN team_name LIKE '%U13 Gold%'  THEN REPLACE(team_name, 'U13 Gold',  'U14 Gold')
    WHEN team_name ~ '\mU14\M' THEN regexp_replace(team_name, '\mU14\M', 'U15')
    WHEN team_name ~ '\mU10\M' THEN regexp_replace(team_name, '\mU10\M', 'U11')
    WHEN team_name ~ '\mU9\M'  THEN regexp_replace(team_name, '\mU9\M',  'U10')
    WHEN team_name ~ '\mU7\M'  THEN regexp_replace(team_name, '\mU7\M',  'U8')
    WHEN team_name ~ '\mU6\M'  THEN regexp_replace(team_name, '\mU6\M',  'U7')
    ELSE team_name END;

UPDATE public.player_of_the_match
SET age_group = CASE age_group
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15' ELSE age_group END,
  team_name = CASE
    WHEN team_name LIKE '%U8 Black%' THEN REPLACE(team_name, 'U8 Black', 'U9 Black')
    WHEN team_name LIKE '%U8 Gold%'  THEN REPLACE(team_name, 'U8 Gold',  'U9 Gold')
    WHEN team_name LIKE '%U11 Black%' THEN REPLACE(team_name, 'U11 Black', 'U12 Black')
    WHEN team_name LIKE '%U11 Gold%'  THEN REPLACE(team_name, 'U11 Gold',  'U12 Gold')
    WHEN team_name LIKE '%U13 Black%' THEN REPLACE(team_name, 'U13 Black', 'U14 Black')
    WHEN team_name LIKE '%U13 Gold%'  THEN REPLACE(team_name, 'U13 Gold',  'U14 Gold')
    WHEN team_name ~ '\mU14\M' THEN regexp_replace(team_name, '\mU14\M', 'U15')
    WHEN team_name ~ '\mU10\M' THEN regexp_replace(team_name, '\mU10\M', 'U11')
    WHEN team_name ~ '\mU9\M'  THEN regexp_replace(team_name, '\mU9\M',  'U10')
    WHEN team_name ~ '\mU7\M'  THEN regexp_replace(team_name, '\mU7\M',  'U8')
    WHEN team_name ~ '\mU6\M'  THEN regexp_replace(team_name, '\mU6\M',  'U7')
    ELSE team_name END;

UPDATE public.live_matches
SET age_group = CASE age_group
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15' ELSE age_group END;

UPDATE public.presentation_tables
SET age_group = CASE age_group
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15' ELSE age_group END
WHERE age_group IS NOT NULL;

UPDATE public.tournament_age_groups
SET age_group = CASE age_group
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15'
    WHEN 'U8' THEN 'U9' WHEN 'U11' THEN 'U12' WHEN 'U13' THEN 'U14'
    ELSE age_group END
WHERE age_group IS NOT NULL;

UPDATE public.tournament_photos
SET age_group = CASE age_group
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15' ELSE age_group END
WHERE age_group IS NOT NULL;

UPDATE public.player_registrations
SET preferred_age_group = CASE preferred_age_group
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15' ELSE preferred_age_group END
WHERE preferred_age_group IS NOT NULL;

UPDATE public.club_events
SET team = CASE team
    WHEN 'U6' THEN 'U7' WHEN 'U7' THEN 'U8'
    WHEN 'U8 Black' THEN 'U9 Black' WHEN 'U8 Gold' THEN 'U9 Gold'
    WHEN 'U9' THEN 'U10' WHEN 'U10' THEN 'U11'
    WHEN 'U11 Black' THEN 'U12 Black' WHEN 'U11 Gold' THEN 'U12 Gold'
    WHEN 'U13 Black' THEN 'U14 Black' WHEN 'U13 Gold' THEN 'U14 Gold'
    WHEN 'U14' THEN 'U15' ELSE team END
WHERE team IS NOT NULL;

UPDATE public.tournament_teams
SET team_name = CASE
    WHEN team_name LIKE '%U8 Black%' THEN REPLACE(team_name, 'U8 Black', 'U9 Black')
    WHEN team_name LIKE '%U8 Gold%'  THEN REPLACE(team_name, 'U8 Gold',  'U9 Gold')
    WHEN team_name LIKE '%U11 Black%' THEN REPLACE(team_name, 'U11 Black', 'U12 Black')
    WHEN team_name LIKE '%U11 Gold%'  THEN REPLACE(team_name, 'U11 Gold',  'U12 Gold')
    WHEN team_name LIKE '%U13 Black%' THEN REPLACE(team_name, 'U13 Black', 'U14 Black')
    WHEN team_name LIKE '%U13 Gold%'  THEN REPLACE(team_name, 'U13 Gold',  'U14 Gold')
    WHEN team_name ~ '\mU14\M' THEN regexp_replace(team_name, '\mU14\M', 'U15')
    WHEN team_name ~ '\mU10\M' THEN regexp_replace(team_name, '\mU10\M', 'U11')
    WHEN team_name ~ '\mU9\M'  THEN regexp_replace(team_name, '\mU9\M',  'U10')
    WHEN team_name ~ '\mU7\M'  THEN regexp_replace(team_name, '\mU7\M',  'U8')
    WHEN team_name ~ '\mU6\M'  THEN regexp_replace(team_name, '\mU6\M',  'U7')
    ELSE team_name END
WHERE team_name IS NOT NULL;

-- =====================================================================
-- 3. SLUG UPDATES
-- =====================================================================

UPDATE public.team_members SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.team_invites SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.team_requests SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.guardians SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.hub_channels SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END
WHERE team_slug IS NOT NULL;

UPDATE public.hub_channels SET name = CASE
    WHEN name LIKE '%U8 Black%' THEN REPLACE(name, 'U8 Black', 'U9 Black')
    WHEN name LIKE '%U8 Gold%'  THEN REPLACE(name, 'U8 Gold',  'U9 Gold')
    WHEN name LIKE '%U11 Black%' THEN REPLACE(name, 'U11 Black', 'U12 Black')
    WHEN name LIKE '%U11 Gold%'  THEN REPLACE(name, 'U11 Gold',  'U12 Gold')
    WHEN name LIKE '%U13 Black%' THEN REPLACE(name, 'U13 Black', 'U14 Black')
    WHEN name LIKE '%U13 Gold%'  THEN REPLACE(name, 'U13 Gold',  'U14 Gold')
    WHEN name ~ '\mU14\M' THEN regexp_replace(name, '\mU14\M', 'U15')
    WHEN name ~ '\mU10\M' THEN regexp_replace(name, '\mU10\M', 'U11')
    WHEN name ~ '\mU9\M'  THEN regexp_replace(name, '\mU9\M',  'U10')
    WHEN name ~ '\mU7\M'  THEN regexp_replace(name, '\mU7\M',  'U8')
    WHEN name ~ '\mU6\M'  THEN regexp_replace(name, '\mU6\M',  'U7')
    ELSE name END;

UPDATE public.hub_availability_events SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.hub_notifications SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END
WHERE team_slug IS NOT NULL;

UPDATE public.hub_payment_requests SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END
WHERE team_slug IS NOT NULL;

UPDATE public.fixture_availability SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.carpool_offers SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.carpool_requests SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.match_player_stats SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.team_selections SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.training_notes SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END;

UPDATE public.presentation_allocations SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END
WHERE team_slug IS NOT NULL;

UPDATE public.presentation_award_settings SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END
WHERE team_slug IS NOT NULL;

UPDATE public.presentation_award_votes SET team_slug = CASE team_slug
    WHEN 'u6s' THEN 'u7s' WHEN 'u7s' THEN 'u8s'
    WHEN 'u8s-black' THEN 'u9s-black' WHEN 'u8s-gold' THEN 'u9s-gold'
    WHEN 'u9s' THEN 'u10s' WHEN 'u10s' THEN 'u11s'
    WHEN 'u11s-black' THEN 'u12s-black' WHEN 'u11s-gold' THEN 'u12s-gold'
    WHEN 'u13s-black' THEN 'u14s-black' WHEN 'u13s-gold' THEN 'u14s-gold'
    WHEN 'u14s' THEN 'u15s' ELSE team_slug END
WHERE team_slug IS NOT NULL;
