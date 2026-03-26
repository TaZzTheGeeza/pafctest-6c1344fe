
-- Carpool offers table
CREATE TABLE public.carpool_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  team_slug TEXT NOT NULL,
  fixture_date TEXT NOT NULL,
  opponent TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'both',
  seats_available INTEGER NOT NULL DEFAULT 1,
  pickup_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.carpool_offers ENABLE ROW LEVEL SECURITY;

-- Team members can view carpool offers for their team
CREATE POLICY "Team members can view carpool offers"
ON public.carpool_offers FOR SELECT TO authenticated
USING (is_team_member(auth.uid(), team_slug) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role));

-- Users can manage own carpool offers
CREATE POLICY "Users can manage own carpool offers"
ON public.carpool_offers FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Coaches/admins can view all
CREATE POLICY "Coaches admins can view all carpool offers"
ON public.carpool_offers FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Guardian links table
CREATE TABLE public.guardians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  team_slug TEXT NOT NULL,
  invite_token TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- Parents can view own guardian links
CREATE POLICY "Parents can view own guardian links"
ON public.guardians FOR SELECT TO authenticated
USING (auth.uid() = parent_user_id);

-- Parents can manage own guardian links
CREATE POLICY "Parents can manage own guardian links"
ON public.guardians FOR ALL TO authenticated
USING (auth.uid() = parent_user_id)
WITH CHECK (auth.uid() = parent_user_id);

-- Coaches and admins can manage all guardian links
CREATE POLICY "Coaches admins can manage guardians"
ON public.guardians FOR ALL TO authenticated
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Coaches can view guardians for their teams
CREATE POLICY "Coaches can view team guardians"
ON public.guardians FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
