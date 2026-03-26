
-- Carpool lift requests table
CREATE TABLE public.carpool_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_slug text NOT NULL,
  fixture_date text NOT NULL,
  opponent text NOT NULL,
  direction text NOT NULL DEFAULT 'both',
  passengers_count integer NOT NULL DEFAULT 1,
  pickup_location text,
  notes text,
  status text NOT NULL DEFAULT 'open',
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.carpool_requests ENABLE ROW LEVEL SECURITY;

-- Team members can view requests for their team
CREATE POLICY "Team members can view carpool requests"
  ON public.carpool_requests FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_slug) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- Users can manage own requests
CREATE POLICY "Users can manage own carpool requests"
  ON public.carpool_requests FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Any team member can accept a request (update accepted_by)
CREATE POLICY "Team members can accept requests"
  ON public.carpool_requests FOR UPDATE TO authenticated
  USING (is_team_member(auth.uid(), team_slug) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'))
  WITH CHECK (is_team_member(auth.uid(), team_slug) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));
