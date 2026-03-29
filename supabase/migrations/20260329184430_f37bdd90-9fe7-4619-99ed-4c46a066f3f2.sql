
-- 1. Fix raffle_tickets: remove anon SELECT, create a view for public number checking
DROP POLICY IF EXISTS "Public can view ticket numbers" ON raffle_tickets;

-- Create a security-invoker view exposing only non-PII columns
CREATE OR REPLACE VIEW public.raffle_ticket_numbers
WITH (security_invoker = on) AS
SELECT raffle_id, ticket_number, payment_status
FROM raffle_tickets;

-- 2. Fix tournaments: remove the remaining public ALL policy
DROP POLICY IF EXISTS "Allow tournament management" ON tournaments;
-- Check if admin policy already exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tournaments' AND policyname = 'Admins can manage tournaments') THEN
    EXECUTE 'CREATE POLICY "Admins can manage tournaments" ON tournaments FOR ALL TO authenticated USING (has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- 3. Fix registration-photos: drop the old public SELECT if it still exists
DROP POLICY IF EXISTS "Anyone can view registration photos" ON storage.objects;

-- 4. Fix hub_notifications: restrict INSERT to admins/coaches/system
DROP POLICY IF EXISTS "System can insert notifications" ON hub_notifications;
CREATE POLICY "Admins and coaches can insert notifications"
ON hub_notifications FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role));

-- 5. Fix club-photos storage: restrict uploads and deletes to admins/coaches
DROP POLICY IF EXISTS "Allow club photo uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow club photo deletes" ON storage.objects;
CREATE POLICY "Admins and coaches can upload club photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'club-photos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role)));
CREATE POLICY "Admins and coaches can delete club photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'club-photos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role)));

-- 6. Fix tournament_teams: create a public view without PII
CREATE OR REPLACE VIEW public.tournament_teams_public
WITH (security_invoker = on) AS
SELECT id, age_group_id, team_name, club_name, county, status, group_id, player_count, team_category, league_division, created_at
FROM tournament_teams;

-- 7. Fix team_selections: restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view team selections" ON team_selections;
CREATE POLICY "Authenticated users can view team selections"
ON team_selections FOR SELECT TO authenticated
USING (is_team_member(auth.uid(), team_slug) OR has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
