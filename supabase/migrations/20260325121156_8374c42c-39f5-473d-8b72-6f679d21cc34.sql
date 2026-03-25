-- Team selections for fixtures
CREATE TABLE public.team_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_slug text NOT NULL,
  fixture_date text NOT NULL,
  opponent text NOT NULL,
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  formation text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(team_slug, fixture_date, opponent)
);

ALTER TABLE public.team_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team selections" ON public.team_selections
  FOR SELECT TO public USING (true);

CREATE POLICY "Coaches and admins can manage team selections" ON public.team_selections
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin'));

-- Training notes for fixtures
CREATE TABLE public.training_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_slug text NOT NULL,
  fixture_date text,
  opponent text,
  note_type text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.training_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view training notes" ON public.training_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches and admins can manage training notes" ON public.training_notes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin'));