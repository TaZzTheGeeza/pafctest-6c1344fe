
ALTER TABLE public.player_registrations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS guardian_id UUID REFERENCES public.guardians(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_player_registrations_user_id ON public.player_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_player_registrations_guardian_id ON public.player_registrations(guardian_id);

-- Replace the anonymous INSERT policy: only authenticated users can register, and only as themselves
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.player_registrations;

CREATE POLICY "Authenticated users can register their child"
  ON public.player_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own registrations
CREATE POLICY "Users can view their own registrations"
  ON public.player_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure authenticated role has table-level privileges
GRANT SELECT, INSERT ON public.player_registrations TO authenticated;
