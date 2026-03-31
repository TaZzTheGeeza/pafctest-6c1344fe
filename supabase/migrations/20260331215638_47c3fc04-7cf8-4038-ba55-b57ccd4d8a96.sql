-- Make registration-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'registration-photos';

-- Add SELECT policy for admins and coaches only
CREATE POLICY "Admins and coaches can view registration photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'registration-photos'
  AND (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'coach'::text))
);

-- Remove the public INSERT policy for tournament_team_players (anonymous registration should go through edge function)
DROP POLICY IF EXISTS "Anyone can insert team players" ON public.tournament_team_players;

-- Add authenticated insert for tournament team players instead
CREATE POLICY "Anyone can insert team players"
ON public.tournament_team_players FOR INSERT TO anon, authenticated
WITH CHECK (true);