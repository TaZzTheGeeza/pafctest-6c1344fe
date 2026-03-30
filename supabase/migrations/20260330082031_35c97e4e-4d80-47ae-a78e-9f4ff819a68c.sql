
CREATE TABLE public.hub_availability_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_slug text NOT NULL,
  title text NOT NULL,
  event_date text NOT NULL,
  event_time text DEFAULT '10:00',
  venue text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hub_availability_events ENABLE ROW LEVEL SECURITY;

-- Coaches can manage events (they create for their own teams via app logic)
CREATE POLICY "Coaches and admins can manage availability events"
  ON public.hub_availability_events
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Team members can view events for their team
CREATE POLICY "Team members can view availability events"
  ON public.hub_availability_events
  FOR SELECT
  TO authenticated
  USING (is_team_member(auth.uid(), team_slug) OR has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
