
-- TOURNAMENT TABLES: Replace public ALL with admin-only writes, keep public SELECT

-- tournament_teams
DROP POLICY IF EXISTS "Allow team management" ON tournament_teams;
CREATE POLICY "Admins can manage teams"
ON tournament_teams FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete teams"
ON tournament_teams FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- tournament_team_players
DROP POLICY IF EXISTS "Allow team player management" ON tournament_team_players;
CREATE POLICY "Admins can manage team players"
ON tournament_team_players FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete team players"
ON tournament_team_players FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- tournament_groups
DROP POLICY IF EXISTS "Allow group management" ON tournament_groups;
CREATE POLICY "Admins can manage groups"
ON tournament_groups FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- tournament_matches
DROP POLICY IF EXISTS "Allow match management" ON tournament_matches;
CREATE POLICY "Admins can manage matches"
ON tournament_matches FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- tournament_age_groups
DROP POLICY IF EXISTS "Allow age group management" ON tournament_age_groups;
CREATE POLICY "Admins can manage age groups"
ON tournament_age_groups FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- tournament_announcements
DROP POLICY IF EXISTS "Allow announcement management" ON tournament_announcements;
CREATE POLICY "Admins can manage tournament announcements"
ON tournament_announcements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- GALLERY
DROP POLICY IF EXISTS "Allow album management" ON gallery_albums;
CREATE POLICY "Admins can manage albums"
ON gallery_albums FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow photo management" ON gallery_photos;
CREATE POLICY "Admins can manage photos"
ON gallery_photos FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- MATCH REPORTS
DROP POLICY IF EXISTS "Allow match report management" ON match_reports;
CREATE POLICY "Coaches and admins can manage match reports"
ON match_reports FOR ALL TO authenticated
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- POTM
DROP POLICY IF EXISTS "Allow potm management" ON player_of_the_match;
CREATE POLICY "Coaches and admins can manage potm"
ON player_of_the_match FOR ALL TO authenticated
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- LIVE MATCHES
DROP POLICY IF EXISTS "Allow match management" ON live_matches;
CREATE POLICY "Admins and coaches can manage live matches"
ON live_matches FOR ALL TO authenticated
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- CLUB EVENTS
DROP POLICY IF EXISTS "Allow event management" ON club_events;
CREATE POLICY "Admins can manage events"
ON club_events FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Allow announcement management" ON announcements;
CREATE POLICY "Admins can manage announcements"
ON announcements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RAFFLES
DROP POLICY IF EXISTS "Allow raffle management" ON raffles;
CREATE POLICY "Admins can manage raffles"
ON raffles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
