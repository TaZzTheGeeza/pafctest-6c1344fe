
-- Drop the old enum function and all its dependent policies in one shot
DROP FUNCTION public.has_role(uuid, app_role) CASCADE;

-- Now recreate ALL the policies that were dropped, using the text-based has_role function

-- announcements
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- carpool_offers
CREATE POLICY "Coaches admins can view all carpool offers" ON public.carpool_offers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Team members can view carpool offers" ON public.carpool_offers FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_slug) OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text));

-- carpool_requests
CREATE POLICY "Team members can accept requests" ON public.carpool_requests FOR UPDATE TO authenticated
  USING (is_team_member(auth.uid(), team_slug) OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text))
  WITH CHECK (is_team_member(auth.uid(), team_slug) OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text));
CREATE POLICY "Team members can view carpool requests" ON public.carpool_requests FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_slug) OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text));

-- club_documents
CREATE POLICY "Admins can manage club documents" ON public.club_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- club_events
CREATE POLICY "Admins can manage events" ON public.club_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- contact_submissions
CREATE POLICY "Admins can manage submissions" ON public.contact_submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Admins can view submissions" ON public.contact_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text));

-- document_upload_permissions
CREATE POLICY "Admins can manage upload permissions" ON public.document_upload_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- enquiry_replies
CREATE POLICY "Admins can manage enquiry replies" ON public.enquiry_replies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- event_rsvps
CREATE POLICY "Coaches and admins can view all RSVPs" ON public.event_rsvps FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- fixture_availability
CREATE POLICY "Coaches and admins can view all availability" ON public.fixture_availability FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- gallery_albums
CREATE POLICY "Admins can manage albums" ON public.gallery_albums FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- gallery_photos
CREATE POLICY "Admins can manage photos" ON public.gallery_photos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- guardians
CREATE POLICY "Coaches admins can manage guardians" ON public.guardians FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Coaches can view team guardians" ON public.guardians FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- hub_availability_events
CREATE POLICY "Coaches and admins can manage availability events" ON public.hub_availability_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Team members can view availability events" ON public.hub_availability_events FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_slug) OR public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- hub_channels
CREATE POLICY "Coaches and admins can manage channels" ON public.hub_channels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Team members can view their channels" ON public.hub_channels FOR SELECT TO authenticated
  USING (team_slug IS NULL OR is_team_member(auth.uid(), team_slug) OR public.has_role(auth.uid(), 'admin'::text));

-- hub_messages
CREATE POLICY "Team members can view channel messages" ON public.hub_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_channels c WHERE c.id = hub_messages.channel_id AND (c.team_slug IS NULL OR is_team_member(auth.uid(), c.team_slug) OR public.has_role(auth.uid(), 'admin'::text))));
CREATE POLICY "Users can delete own messages" ON public.hub_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::text));

-- hub_notifications
CREATE POLICY "Admins and coaches can insert notifications" ON public.hub_notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text));

-- hub_payment_requests
CREATE POLICY "Coaches and admins can manage payment requests" ON public.hub_payment_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Team members can view their payment requests" ON public.hub_payment_requests FOR SELECT TO authenticated
  USING (team_slug IS NULL OR is_team_member(auth.uid(), team_slug) OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text));

-- hub_payments
CREATE POLICY "Users can view own payments" ON public.hub_payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- live_matches
CREATE POLICY "Admins and coaches can manage live matches" ON public.live_matches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- match_player_stats
CREATE POLICY "Coaches and admins can manage match player stats" ON public.match_player_stats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- match_reports
CREATE POLICY "Coaches and admins can manage match reports" ON public.match_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- player_documents
CREATE POLICY "Admins and coaches can manage player documents" ON public.player_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text));

-- player_of_the_match
CREATE POLICY "Coaches and admins can manage potm" ON public.player_of_the_match FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- player_registrations
CREATE POLICY "Admins can manage registrations" ON public.player_registrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Admins can view registrations" ON public.player_registrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text));

-- player_stats
CREATE POLICY "Coaches and admins can manage player stats" ON public.player_stats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- profiles
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Coaches can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text));

-- raffle_tickets
CREATE POLICY "Admins and coaches can view all tickets" ON public.raffle_tickets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text));
CREATE POLICY "Authenticated admins can manage tickets" ON public.raffle_tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- raffles
CREATE POLICY "Admins can manage raffles" ON public.raffles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- role_permissions
CREATE POLICY "Admins can manage role permissions" ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- safeguarding_reports
CREATE POLICY "Admins can manage safeguarding reports" ON public.safeguarding_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- site_settings
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- team_members
CREATE POLICY "Admins can manage all memberships" ON public.team_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Coaches can manage team memberships" ON public.team_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text)) WITH CHECK (public.has_role(auth.uid(), 'coach'::text));

-- team_selections
CREATE POLICY "Coaches and admins can manage team selections" ON public.team_selections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Authenticated users can view team selections" ON public.team_selections FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text) OR is_team_member(auth.uid(), team_slug));

-- training_notes
CREATE POLICY "Coaches and admins can manage training notes" ON public.training_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Team members can view training notes" ON public.training_notes FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_slug) OR public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- user_age_groups
CREATE POLICY "Admins can manage age groups" ON public.user_age_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- user_roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- team_requests
CREATE POLICY "Admins can manage all requests" ON public.team_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Coaches can view team requests" ON public.team_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach'::text) OR public.has_role(auth.uid(), 'admin'::text));

-- tournaments
CREATE POLICY "Admins can manage tournaments" ON public.tournaments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- tournament_teams
CREATE POLICY "Admins can manage teams" ON public.tournament_teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Admins can delete teams" ON public.tournament_teams FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Admins and coaches can view all team details" ON public.tournament_teams FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text));

-- tournament_team_players
CREATE POLICY "Admins can manage team players" ON public.tournament_team_players FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Admins can delete team players" ON public.tournament_team_players FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text));

-- tournament_groups
CREATE POLICY "Admins can manage groups" ON public.tournament_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- tournament_matches
CREATE POLICY "Admins can manage matches" ON public.tournament_matches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- tournament_age_groups
CREATE POLICY "Admins can manage age groups" ON public.tournament_age_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- tournament_announcements
CREATE POLICY "Admins can manage tournament announcements" ON public.tournament_announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::text)) WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

-- storage.objects
CREATE POLICY "Admins and coaches can upload club photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'club-photos' AND (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text)));
CREATE POLICY "Admins and coaches can delete club photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'club-photos' AND (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text)));
CREATE POLICY "Admins and coaches can update club photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'club-photos' AND (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text)))
  WITH CHECK (bucket_id = 'club-photos' AND (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'coach'::text)));
CREATE POLICY "Admins can upload raffle images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'raffle-images' AND public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Admins can upload draw videos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'draw-videos' AND public.has_role(auth.uid(), 'admin'::text));
