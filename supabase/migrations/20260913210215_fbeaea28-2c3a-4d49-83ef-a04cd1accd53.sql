CREATE TABLE public.league_tables (
  table_url TEXT PRIMARY KEY,
  division_name TEXT NOT NULL,
  standings JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.league_tables TO authenticated;
GRANT ALL ON public.league_tables TO service_role;
ALTER TABLE public.league_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view league tables" ON public.league_tables FOR SELECT TO authenticated USING (true);