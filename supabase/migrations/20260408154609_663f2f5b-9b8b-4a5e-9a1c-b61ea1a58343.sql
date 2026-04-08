-- Fix: Remove public SELECT on tournament_team_players (exposes children's names & DOBs)
DROP POLICY IF EXISTS "Anyone can view team players" ON public.tournament_team_players;

-- Only admins and coaches can view player details
CREATE POLICY "Admins can view team players"
ON public.tournament_team_players
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can view team players"
ON public.tournament_team_players
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'coach'));