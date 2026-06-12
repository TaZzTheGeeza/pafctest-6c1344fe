
-- club_meetings: restrict SELECT to invitees + admins
DROP POLICY IF EXISTS "Authenticated users can view meetings" ON public.club_meetings;
CREATE POLICY "Invitees and admins can view meetings"
  ON public.club_meetings
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meeting_invitees mi
      WHERE mi.meeting_id = club_meetings.id AND mi.user_id = auth.uid()
    )
  );

-- meeting_rsvps: restrict SELECT to owner + admins/coaches
DROP POLICY IF EXISTS "Authenticated users can view meeting RSVPs" ON public.meeting_rsvps;
CREATE POLICY "Owner admins and coaches can view meeting RSVPs"
  ON public.meeting_rsvps
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'coach')
  );

-- presentation_tickets: restrict SELECT to owner + admins
DROP POLICY IF EXISTS "Authenticated users can view seat occupancy" ON public.presentation_tickets;
CREATE POLICY "Owner and admins can view presentation tickets"
  ON public.presentation_tickets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin')
  );

-- hub_messages: senders must be team members of the channel's team
DROP POLICY IF EXISTS "Authenticated can send messages" ON public.hub_messages;
CREATE POLICY "Team members can send messages"
  ON public.hub_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.hub_channels c
      WHERE c.id = hub_messages.channel_id
        AND (
          c.team_slug IS NULL
          OR is_team_member(auth.uid(), c.team_slug)
          OR has_role(auth.uid(), 'admin')
        )
    )
  );

-- hub_message_reactions: reactors must be team members of the channel's team
DROP POLICY IF EXISTS "Users can add reactions" ON public.hub_message_reactions;
CREATE POLICY "Team members can add reactions"
  ON public.hub_message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.hub_messages m
      JOIN public.hub_channels c ON c.id = m.channel_id
      WHERE m.id = hub_message_reactions.message_id
        AND (
          c.team_slug IS NULL
          OR is_team_member(auth.uid(), c.team_slug)
          OR has_role(auth.uid(), 'admin')
        )
    )
  );

-- player_registrations: ensure user_id is not null on self-registration insert
DROP POLICY IF EXISTS "Authenticated users can register their child" ON public.player_registrations;
CREATE POLICY "Authenticated users can register their child"
  ON public.player_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);
