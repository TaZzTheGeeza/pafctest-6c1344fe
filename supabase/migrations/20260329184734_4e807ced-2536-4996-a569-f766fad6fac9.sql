
-- 1. Raffle tickets: use a secure function instead of anon SELECT
DROP POLICY IF EXISTS "Anon can view raffle ticket numbers" ON raffle_tickets;

-- Create a function that returns only non-PII ticket data
CREATE OR REPLACE FUNCTION public.get_taken_ticket_numbers(_raffle_id uuid)
RETURNS TABLE(ticket_number int, payment_status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rt.ticket_number, rt.payment_status
  FROM raffle_tickets rt
  WHERE rt.raffle_id = _raffle_id
    AND rt.payment_status IN ('paid', 'pending')
$$;

-- 2. Tournament teams: restrict direct SELECT to admins, public uses the view
DROP POLICY IF EXISTS "Anyone can view teams" ON tournament_teams;
CREATE POLICY "Admins and coaches can view all team details"
ON tournament_teams FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role));
-- Public tournament page needs basic team info (name, group, status)
CREATE POLICY "Anyone can view basic team info"
ON tournament_teams FOR SELECT TO anon
USING (true);

-- 3. Event RSVPs: remove overly broad policy
DROP POLICY IF EXISTS "Users can view RSVPs for events" ON event_rsvps;

-- 4. Training notes: restrict to team members
DROP POLICY IF EXISTS "Anyone can view training notes" ON training_notes;
CREATE POLICY "Team members can view training notes"
ON training_notes FOR SELECT TO authenticated
USING (is_team_member(auth.uid(), team_slug) OR has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Storage: restrict registration-photos upload to authenticated only
DROP POLICY IF EXISTS "Anyone can upload registration photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload registration photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'registration-photos');

-- 6. Storage: restrict raffle-images upload to admins
DROP POLICY IF EXISTS "Allow raffle image uploads" ON storage.objects;
CREATE POLICY "Admins can upload raffle images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'raffle-images' AND has_role(auth.uid(), 'admin'::app_role));

-- 7. Storage: restrict club-photos UPDATE to admins/coaches
DROP POLICY IF EXISTS "Allow club photo updates" ON storage.objects;
CREATE POLICY "Admins and coaches can update club photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'club-photos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role)))
WITH CHECK (bucket_id = 'club-photos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role)));

-- 8. Storage: restrict draw-videos upload to admins
DROP POLICY IF EXISTS "Authenticated users can upload draw videos" ON storage.objects;
CREATE POLICY "Admins can upload draw videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'draw-videos' AND has_role(auth.uid(), 'admin'::app_role));
