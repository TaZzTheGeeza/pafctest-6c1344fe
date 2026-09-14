UPDATE public.kit_issues SET team_slug = 'u8s-gold' WHERE team_slug = 'u8';
UPDATE public.kit_issues
SET team_slug = regexp_replace(replace(lower(trim(team_slug)), ' ', '-'), '^u([0-9]+)', 'u\1s')
WHERE team_slug IS NOT NULL AND team_slug !~ '^u[0-9]+s(-.*)?$';