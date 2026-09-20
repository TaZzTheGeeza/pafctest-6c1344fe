CREATE TABLE public.fa_fixture_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_slug text NOT NULL,
  fixture_date text NOT NULL,
  opponent text NOT NULL,
  kickoff_time text,
  venue text,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_slug, fixture_date, opponent)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fa_fixture_overrides TO authenticated;
GRANT SELECT ON public.fa_fixture_overrides TO anon;
GRANT ALL ON public.fa_fixture_overrides TO service_role;

ALTER TABLE public.fa_fixture_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fixture changes"
  ON public.fa_fixture_overrides FOR SELECT
  USING (true);

CREATE POLICY "Coaches and admins can add fixture changes"
  ON public.fa_fixture_overrides FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches and admins can edit fixture changes"
  ON public.fa_fixture_overrides FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches and admins can remove fixture changes"
  ON public.fa_fixture_overrides FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_fa_fixture_overrides_updated_at
  BEFORE UPDATE ON public.fa_fixture_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();