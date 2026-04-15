DROP POLICY IF EXISTS "Anyone can look up invite by token" ON public.team_invites;

CREATE POLICY "Anyone can look up invite by token"
  ON public.team_invites
  FOR SELECT
  TO anon, authenticated
  USING (true);