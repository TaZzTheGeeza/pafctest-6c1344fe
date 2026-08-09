CREATE OR REPLACE FUNCTION public.canonical_team_slug(_slug text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE lower(trim(coalesce(_slug, '')))
    WHEN 'u6' THEN 'u6s' WHEN 'u6s' THEN 'u6s'
    WHEN 'u7' THEN 'u7s' WHEN 'u7s' THEN 'u7s'
    WHEN 'u8' THEN 'u8s' WHEN 'u8s' THEN 'u8s'
    WHEN 'u8-black' THEN 'u8s-black' WHEN 'u8s-black' THEN 'u8s-black'
    WHEN 'u8-gold' THEN 'u8s-gold' WHEN 'u8s-gold' THEN 'u8s-gold'
    WHEN 'u9' THEN 'u9s' WHEN 'u9s' THEN 'u9s'
    WHEN 'u9-black' THEN 'u9s-black' WHEN 'u9s-black' THEN 'u9s-black'
    WHEN 'u9-gold' THEN 'u9s-gold' WHEN 'u9s-gold' THEN 'u9s-gold'
    WHEN 'u10' THEN 'u10s' WHEN 'u10s' THEN 'u10s'
    WHEN 'u11' THEN 'u11s' WHEN 'u11s' THEN 'u11s'
    WHEN 'u11-black' THEN 'u11s-black' WHEN 'u11s-black' THEN 'u11s-black'
    WHEN 'u11-gold' THEN 'u11s-gold' WHEN 'u11s-gold' THEN 'u11s-gold'
    WHEN 'u12-black' THEN 'u12s-black' WHEN 'u12s-black' THEN 'u12s-black'
    WHEN 'u12-gold' THEN 'u12s-gold' WHEN 'u12s-gold' THEN 'u12s-gold'
    WHEN 'u12-white' THEN 'u12s-white' WHEN 'u12s-white' THEN 'u12s-white'
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
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE public.canonical_team_slug(_value)
    WHEN 'u6s' THEN 'U6' WHEN 'u7s' THEN 'U7' WHEN 'u8s' THEN 'U8'
    WHEN 'u8s-black' THEN 'U8 Black' WHEN 'u8s-gold' THEN 'U8 Gold'
    WHEN 'u9s' THEN 'U9' WHEN 'u9s-black' THEN 'U9 Black' WHEN 'u9s-gold' THEN 'U9 Gold'
    WHEN 'u10s' THEN 'U10' WHEN 'u11s' THEN 'U11'
    WHEN 'u11s-black' THEN 'U11 Black' WHEN 'u11s-gold' THEN 'U11 Gold'
    WHEN 'u12s-black' THEN 'U12 Black' WHEN 'u12s-gold' THEN 'U12 Gold'
    WHEN 'u12s-white' THEN 'U12 White'
    WHEN 'u13s' THEN 'U13' WHEN 'u13s-black' THEN 'U13 Black' WHEN 'u13s-gold' THEN 'U13 Gold'
    WHEN 'u14s' THEN 'U14' WHEN 'u14s-black' THEN 'U14 Black' WHEN 'u14s-gold' THEN 'U14 Gold'
    WHEN 'u15s' THEN 'U15'
    ELSE trim(coalesce(_value, ''))
  END
$function$;