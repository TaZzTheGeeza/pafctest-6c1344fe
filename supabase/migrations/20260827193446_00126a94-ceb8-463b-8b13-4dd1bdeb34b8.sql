CREATE TABLE IF NOT EXISTS public.fa_fixture_cache (
  cache_key text PRIMARY KEY,
  team text,
  fixtures jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fa_fixture_cache TO authenticated;
GRANT ALL ON public.fa_fixture_cache TO service_role;

ALTER TABLE public.fa_fixture_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users can read fixture cache" ON public.fa_fixture_cache;
CREATE POLICY "Signed-in users can read fixture cache"
ON public.fa_fixture_cache FOR SELECT TO authenticated USING (true);