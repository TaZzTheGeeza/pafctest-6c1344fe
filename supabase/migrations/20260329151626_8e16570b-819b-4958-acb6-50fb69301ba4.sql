
CREATE TABLE public.team_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_slug text NOT NULL,
  role_requested text NOT NULL DEFAULT 'parent',
  player_name text,
  invite_code text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT team_requests_unique_pending UNIQUE (user_id, team_slug, status)
);

ALTER TABLE public.team_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can submit team requests"
  ON public.team_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON public.team_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view and manage all requests
CREATE POLICY "Admins can manage all requests"
  ON public.team_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Coaches can view requests for their teams
CREATE POLICY "Coaches can view team requests"
  ON public.team_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach'));
