
CREATE TABLE public.fixture_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_slug text NOT NULL,
  fixture_date text NOT NULL,
  opponent text NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (team_slug, fixture_date, opponent, user_id)
);

ALTER TABLE public.fixture_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own availability"
  ON public.fixture_availability FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches and admins can view all availability"
  ON public.fixture_availability FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'coach'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Team members can view team availability"
  ON public.fixture_availability FOR SELECT
  TO authenticated
  USING (is_team_member(auth.uid(), team_slug));
