
-- Extend raffles with sweepstake fields
ALTER TABLE public.raffles
  ADD COLUMN IF NOT EXISTS sweepstake_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS teams_revealed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prize_winner_pence integer,
  ADD COLUMN IF NOT EXISTS prize_runner_up_pence integer,
  ADD COLUMN IF NOT EXISTS prize_third_pence integer,
  ADD COLUMN IF NOT EXISTS prize_golden_boot_pence integer;

-- Team assignments
CREATE TABLE IF NOT EXISTS public.sweepstake_team_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  ticket_number integer NOT NULL,
  country_name text NOT NULL DEFAULT '',
  flag_emoji text NOT NULL DEFAULT '',
  group_letter text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (raffle_id, ticket_number)
);

GRANT SELECT ON public.sweepstake_team_assignments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sweepstake_team_assignments TO authenticated;
GRANT ALL ON public.sweepstake_team_assignments TO service_role;

ALTER TABLE public.sweepstake_team_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team assignments"
  ON public.sweepstake_team_assignments FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert team assignments"
  ON public.sweepstake_team_assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update team assignments"
  ON public.sweepstake_team_assignments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete team assignments"
  ON public.sweepstake_team_assignments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sweepstake_team_assignments_updated_at
  BEFORE UPDATE ON public.sweepstake_team_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_sweepstake_assignments_raffle ON public.sweepstake_team_assignments(raffle_id);
