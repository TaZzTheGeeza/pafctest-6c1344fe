CREATE TABLE public.tactics_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_slug TEXT NOT NULL,
  fixture_date TEXT,
  opponent TEXT,
  name TEXT NOT NULL,
  board_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tactics_boards_team ON public.tactics_boards(team_slug);
CREATE INDEX idx_tactics_boards_fixture ON public.tactics_boards(team_slug, fixture_date, opponent);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tactics_boards TO authenticated;
GRANT ALL ON public.tactics_boards TO service_role;

ALTER TABLE public.tactics_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches and admins view boards"
  ON public.tactics_boards FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
  );

CREATE POLICY "Coaches and admins insert boards"
  ON public.tactics_boards FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coach'))
    AND created_by = auth.uid()
  );

CREATE POLICY "Owners and admins update boards"
  ON public.tactics_boards FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR created_by = auth.uid());

CREATE POLICY "Owners and admins delete boards"
  ON public.tactics_boards FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR created_by = auth.uid());

CREATE TRIGGER update_tactics_boards_updated_at
  BEFORE UPDATE ON public.tactics_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();