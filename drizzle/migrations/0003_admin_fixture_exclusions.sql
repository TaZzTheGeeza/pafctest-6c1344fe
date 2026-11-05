CREATE TABLE public.fa_fixture_exclusions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 fixture_url text NOT NULL,
 fixture_date text NOT NULL,
 home_team text NOT NULL,
 away_team text NOT NULL,
 created_by uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (fixture_url, fixture_date, home_team, away_team)
);
GRANT SELECT ON public.fa_fixture_exclusions TO anon, authenticated;
GRANT INSERT, DELETE ON public.fa_fixture_exclusions TO authenticated;
GRANT ALL ON public.fa_fixture_exclusions TO service_role;
ALTER TABLE public.fa_fixture_exclusions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read cancelled fixtures" ON public.fa_fixture_exclusions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can cancel fixtures" ON public.fa_fixture_exclusions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());
CREATE POLICY "Admins can restore fixtures" ON public.fa_fixture_exclusions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.filter_cancelled_fa_fixtures(_cache_key text, _fixtures jsonb) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT coalesce(jsonb_agg(f.value ORDER BY f.ordinality), '[]'::jsonb)
 FROM jsonb_array_elements(coalesce(_fixtures, '[]'::jsonb)) WITH ORDINALITY AS f(value, ordinality)
 WHERE NOT EXISTS (SELECT 1 FROM public.fa_fixture_exclusions e
 WHERE split_part(_cache_key, '::', 1) = e.fixture_url
 AND trim(f.value->>'date') = trim(e.fixture_date)
 AND lower(regexp_replace(trim(f.value->>'homeTeam'), '\s+', ' ', 'g')) = lower(regexp_replace(trim(e.home_team), '\s+', ' ', 'g'))
 AND lower(regexp_replace(trim(f.value->>'awayTeam'), '\s+', ' ', 'g')) = lower(regexp_replace(trim(e.away_team), '\s+', ' ', 'g')));
$$;
CREATE FUNCTION public.filter_cancelled_fa_cache() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 NEW.fixtures := public.filter_cancelled_fa_fixtures(NEW.cache_key, NEW.fixtures);
 RETURN NEW;
END;
$$;
CREATE TRIGGER filter_cancelled_fa_cache BEFORE INSERT OR UPDATE ON public.fa_fixture_cache FOR EACH ROW EXECUTE FUNCTION public.filter_cancelled_fa_cache();
CREATE FUNCTION public.remove_cancelled_fa_from_cache() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE public.fa_fixture_cache SET fixtures = public.filter_cancelled_fa_fixtures(cache_key, fixtures)
 WHERE split_part(cache_key, '::', 1) = NEW.fixture_url;
 RETURN NEW;
END;
$$;
CREATE TRIGGER remove_cancelled_fa_from_cache AFTER INSERT ON public.fa_fixture_exclusions FOR EACH ROW EXECUTE FUNCTION public.remove_cancelled_fa_from_cache();