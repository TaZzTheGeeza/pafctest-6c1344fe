CREATE OR REPLACE FUNCTION public.canonical_team_slug(_slug text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(trim(coalesce(_slug, '')))
    WHEN 'u6' THEN 'u6s'
    WHEN 'u6s' THEN 'u6s'
    WHEN 'u7' THEN 'u7s'
    WHEN 'u7s' THEN 'u7s'
    WHEN 'u8-black' THEN 'u8s-black'
    WHEN 'u8s-black' THEN 'u8s-black'
    WHEN 'u8-gold' THEN 'u8s-gold'
    WHEN 'u8s-gold' THEN 'u8s-gold'
    WHEN 'u9' THEN 'u9s'
    WHEN 'u9s' THEN 'u9s'
    WHEN 'u10' THEN 'u10s'
    WHEN 'u10s' THEN 'u10s'
    WHEN 'u11-black' THEN 'u11s-black'
    WHEN 'u11s-black' THEN 'u11s-black'
    WHEN 'u11-gold' THEN 'u11s-gold'
    WHEN 'u11s-gold' THEN 'u11s-gold'
    WHEN 'u13-black' THEN 'u13s-black'
    WHEN 'u13s-black' THEN 'u13s-black'
    WHEN 'u13-gold' THEN 'u13s-gold'
    WHEN 'u13s-gold' THEN 'u13s-gold'
    WHEN 'u14' THEN 'u14s'
    WHEN 'u14s' THEN 'u14s'
    ELSE lower(trim(coalesce(_slug, '')))
  END
$$;

CREATE OR REPLACE FUNCTION public.canonical_age_group(_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE public.canonical_team_slug(_value)
    WHEN 'u6s' THEN 'U6'
    WHEN 'u7s' THEN 'U7'
    WHEN 'u8s-black' THEN 'U8 Black'
    WHEN 'u8s-gold' THEN 'U8 Gold'
    WHEN 'u9s' THEN 'U9'
    WHEN 'u10s' THEN 'U10'
    WHEN 'u11s-black' THEN 'U11 Black'
    WHEN 'u11s-gold' THEN 'U11 Gold'
    WHEN 'u13s-black' THEN 'U13 Black'
    WHEN 'u13s-gold' THEN 'U13 Gold'
    WHEN 'u14s' THEN 'U14'
    ELSE trim(coalesce(_value, ''))
  END
$$;

CREATE OR REPLACE FUNCTION public.normalize_team_slug_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.team_slug := public.canonical_team_slug(NEW.team_slug);
  RETURN NEW;
END;
$$;

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, public.canonical_team_slug(team_slug)
           ORDER BY CASE WHEN team_slug = public.canonical_team_slug(team_slug) THEN 0 ELSE 1 END, created_at NULLS LAST, id
         ) AS rn
  FROM public.team_members
)
DELETE FROM public.team_members tm
USING ranked r
WHERE tm.id = r.id AND r.rn > 1;

UPDATE public.team_members
SET team_slug = public.canonical_team_slug(team_slug)
WHERE team_slug IS DISTINCT FROM public.canonical_team_slug(team_slug);

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, public.canonical_team_slug(team_slug), status
           ORDER BY CASE WHEN team_slug = public.canonical_team_slug(team_slug) THEN 0 ELSE 1 END, created_at DESC NULLS LAST, id
         ) AS rn
  FROM public.team_requests
)
DELETE FROM public.team_requests tr
USING ranked r
WHERE tr.id = r.id AND r.rn > 1;

UPDATE public.team_requests
SET team_slug = public.canonical_team_slug(team_slug)
WHERE team_slug IS DISTINCT FROM public.canonical_team_slug(team_slug);

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY parent_user_id, lower(trim(player_name)), public.canonical_team_slug(team_slug), status
           ORDER BY CASE WHEN team_slug = public.canonical_team_slug(team_slug) THEN 0 ELSE 1 END, created_at NULLS LAST, id
         ) AS rn
  FROM public.guardians
  WHERE trim(coalesce(player_name, '')) <> ''
)
DELETE FROM public.guardians g
USING ranked r
WHERE g.id = r.id AND r.rn > 1;

UPDATE public.guardians
SET team_slug = public.canonical_team_slug(team_slug)
WHERE team_slug IS DISTINCT FROM public.canonical_team_slug(team_slug);

WITH normalized AS (
  SELECT id, user_id, public.canonical_age_group(age_group) AS canonical_label,
         row_number() OVER (
           PARTITION BY user_id, public.canonical_age_group(age_group)
           ORDER BY CASE WHEN age_group = public.canonical_age_group(age_group) THEN 0 ELSE 1 END, created_at NULLS LAST, id
         ) AS rn
  FROM public.user_age_groups
)
DELETE FROM public.user_age_groups uag
USING normalized n
WHERE uag.id = n.id AND n.rn > 1;

UPDATE public.user_age_groups
SET age_group = public.canonical_age_group(age_group)
WHERE age_group IS DISTINCT FROM public.canonical_age_group(age_group);

UPDATE public.guardians g
SET player_name = trim(tr.player_name)
FROM public.team_requests tr
WHERE tr.status = 'approved'
  AND tr.role_requested = 'parent'
  AND trim(coalesce(tr.player_name, '')) <> ''
  AND g.parent_user_id = tr.user_id
  AND g.status = 'active'
  AND public.canonical_team_slug(g.team_slug) = public.canonical_team_slug(tr.team_slug)
  AND lower(split_part(trim(g.player_name), ' ', 1)) = lower(split_part(trim(tr.player_name), ' ', 1))
  AND lower(trim(g.player_name)) <> lower(trim(tr.player_name))
  AND length(trim(g.player_name)) < length(trim(tr.player_name))
  AND NOT EXISTS (
    SELECT 1
    FROM public.guardians exact
    WHERE exact.parent_user_id = tr.user_id
      AND exact.status = 'active'
      AND public.canonical_team_slug(exact.team_slug) = public.canonical_team_slug(tr.team_slug)
      AND lower(trim(exact.player_name)) = lower(trim(tr.player_name))
  );

INSERT INTO public.guardians (parent_user_id, player_name, team_slug, status)
SELECT tr.user_id, trim(tr.player_name), public.canonical_team_slug(tr.team_slug), 'active'
FROM public.team_requests tr
WHERE tr.status = 'approved'
  AND tr.role_requested = 'parent'
  AND trim(coalesce(tr.player_name, '')) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.guardians g
    WHERE g.parent_user_id = tr.user_id
      AND g.status = 'active'
      AND lower(trim(g.player_name)) = lower(trim(tr.player_name))
      AND public.canonical_team_slug(g.team_slug) = public.canonical_team_slug(tr.team_slug)
  );

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY parent_user_id, lower(trim(player_name)), team_slug
           ORDER BY created_at NULLS LAST, id
         ) AS rn
  FROM public.guardians
  WHERE status = 'active' AND trim(coalesce(player_name, '')) <> ''
)
DELETE FROM public.guardians g
USING ranked r
WHERE g.id = r.id AND r.rn > 1;

INSERT INTO public.team_members (user_id, team_slug, role)
SELECT DISTINCT tr.user_id,
       public.canonical_team_slug(tr.team_slug),
       CASE WHEN tr.role_requested = 'coach' THEN 'coach' ELSE 'parent' END
FROM public.team_requests tr
WHERE tr.status = 'approved'
ON CONFLICT (user_id, team_slug) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT tr.user_id, 'user'
FROM public.team_requests tr
WHERE tr.status = 'approved'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT tr.user_id, 'coach'
FROM public.team_requests tr
WHERE tr.status = 'approved' AND tr.role_requested = 'coach'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_age_groups (user_id, age_group)
SELECT DISTINCT tr.user_id, public.canonical_age_group(tr.team_slug)
FROM public.team_requests tr
WHERE tr.status = 'approved'
ON CONFLICT (user_id, age_group) DO NOTHING;

DROP TRIGGER IF EXISTS normalize_team_members_team_slug ON public.team_members;
CREATE TRIGGER normalize_team_members_team_slug
BEFORE INSERT OR UPDATE OF team_slug ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.normalize_team_slug_column();

DROP TRIGGER IF EXISTS normalize_team_requests_team_slug ON public.team_requests;
CREATE TRIGGER normalize_team_requests_team_slug
BEFORE INSERT OR UPDATE OF team_slug ON public.team_requests
FOR EACH ROW EXECUTE FUNCTION public.normalize_team_slug_column();

DROP TRIGGER IF EXISTS normalize_guardians_team_slug ON public.guardians;
CREATE TRIGGER normalize_guardians_team_slug
BEFORE INSERT OR UPDATE OF team_slug ON public.guardians
FOR EACH ROW EXECUTE FUNCTION public.normalize_team_slug_column();

CREATE UNIQUE INDEX IF NOT EXISTS guardians_active_parent_player_team_unique
ON public.guardians (parent_user_id, lower(trim(player_name)), team_slug)
WHERE status = 'active' AND trim(coalesce(player_name, '')) <> '';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_team_slug_canonical') THEN
    ALTER TABLE public.team_members
      ADD CONSTRAINT team_members_team_slug_canonical CHECK (team_slug = public.canonical_team_slug(team_slug));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guardians_team_slug_canonical') THEN
    ALTER TABLE public.guardians
      ADD CONSTRAINT guardians_team_slug_canonical CHECK (team_slug = public.canonical_team_slug(team_slug));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_requests_team_slug_canonical') THEN
    ALTER TABLE public.team_requests
      ADD CONSTRAINT team_requests_team_slug_canonical CHECK (team_slug = public.canonical_team_slug(team_slug));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_age_groups_age_group_canonical') THEN
    ALTER TABLE public.user_age_groups
      ADD CONSTRAINT user_age_groups_age_group_canonical CHECK (age_group = public.canonical_age_group(age_group));
  END IF;
END $$;