
-- Team Members: links users to specific team slugs
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_slug text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_slug)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships" ON public.team_members
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships" ON public.team_members
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can manage team memberships" ON public.team_members
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'coach'))
  WITH CHECK (has_role(auth.uid(), 'coach'));

-- Security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_slug = _team_slug
  )
$$;

-- Add team_slug to hub_channels if not already team-scoped
-- Update hub_channels RLS to be team-scoped
DROP POLICY IF EXISTS "Anyone authenticated can view channels" ON public.hub_channels;
CREATE POLICY "Team members can view their channels" ON public.hub_channels
  FOR SELECT TO authenticated
  USING (
    team_slug IS NULL
    OR is_team_member(auth.uid(), team_slug)
    OR has_role(auth.uid(), 'admin')
  );

-- Update hub_messages RLS to be team-scoped
DROP POLICY IF EXISTS "Authenticated can view messages" ON public.hub_messages;
CREATE POLICY "Team members can view channel messages" ON public.hub_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hub_channels c
      WHERE c.id = channel_id
      AND (c.team_slug IS NULL OR is_team_member(auth.uid(), c.team_slug) OR has_role(auth.uid(), 'admin'))
    )
  );

-- Update hub_payment_requests RLS to be team-scoped
DROP POLICY IF EXISTS "Authenticated can view payment requests" ON public.hub_payment_requests;
CREATE POLICY "Team members can view their payment requests" ON public.hub_payment_requests
  FOR SELECT TO authenticated
  USING (
    team_slug IS NULL
    OR is_team_member(auth.uid(), team_slug)
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'coach')
  );

-- Add team_slug to club_events for team-scoping (already has 'team' column, we'll use that)
-- Add team_slug to hub_notifications for filtering
ALTER TABLE public.hub_notifications ADD COLUMN IF NOT EXISTS team_slug text;
