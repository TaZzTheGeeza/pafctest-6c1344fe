-- Presentation Evening Awards: voting tables
CREATE TABLE public.presentation_award_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_slug TEXT NOT NULL,
  award_type TEXT NOT NULL CHECK (award_type IN ('players_player','parents_player')),
  voting_open BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_slug, award_type)
);

ALTER TABLE public.presentation_award_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view award settings"
  ON public.presentation_award_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage award settings"
  ON public.presentation_award_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_presentation_award_settings_updated_at
  BEFORE UPDATE ON public.presentation_award_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.presentation_award_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_user_id UUID NOT NULL,
  responding_for TEXT NOT NULL, -- child name (mirrors availability pattern)
  team_slug TEXT NOT NULL,
  award_type TEXT NOT NULL CHECK (award_type IN ('players_player','parents_player')),
  voted_for_player_name TEXT NOT NULL,
  voted_for_player_id UUID, -- optional ref to player_stats.id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (responding_for, team_slug, award_type)
);

ALTER TABLE public.presentation_award_votes ENABLE ROW LEVEL SECURITY;

-- Only admins can see all votes
CREATE POLICY "Admins view all votes"
  ON public.presentation_award_votes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Voter can see their own votes (so UI can show "you voted for X")
CREATE POLICY "Voter views own votes"
  ON public.presentation_award_votes FOR SELECT TO authenticated
  USING (auth.uid() = voter_user_id);

-- Insert: must be the voter, voting must be open, and must be linked guardian for that child+team
CREATE POLICY "Linked guardian can insert vote"
  ON public.presentation_award_votes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = voter_user_id
    AND EXISTS (
      SELECT 1 FROM public.presentation_award_settings s
      WHERE s.team_slug = presentation_award_votes.team_slug
        AND s.award_type = presentation_award_votes.award_type
        AND s.voting_open = true
    )
    AND EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.parent_user_id = auth.uid()
        AND g.team_slug = presentation_award_votes.team_slug
        AND lower(trim(g.player_name)) = lower(trim(presentation_award_votes.responding_for))
        AND g.status = 'active'
    )
  );

-- Update own vote (while voting open)
CREATE POLICY "Voter updates own vote while open"
  ON public.presentation_award_votes FOR UPDATE TO authenticated
  USING (auth.uid() = voter_user_id)
  WITH CHECK (
    auth.uid() = voter_user_id
    AND EXISTS (
      SELECT 1 FROM public.presentation_award_settings s
      WHERE s.team_slug = presentation_award_votes.team_slug
        AND s.award_type = presentation_award_votes.award_type
        AND s.voting_open = true
    )
  );

-- Delete own vote (while voting open)
CREATE POLICY "Voter deletes own vote while open"
  ON public.presentation_award_votes FOR DELETE TO authenticated
  USING (
    auth.uid() = voter_user_id
    AND EXISTS (
      SELECT 1 FROM public.presentation_award_settings s
      WHERE s.team_slug = presentation_award_votes.team_slug
        AND s.award_type = presentation_award_votes.award_type
        AND s.voting_open = true
    )
  );

CREATE TRIGGER update_presentation_award_votes_updated_at
  BEFORE UPDATE ON public.presentation_award_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_paw_votes_team_award ON public.presentation_award_votes (team_slug, award_type);
CREATE INDEX idx_paw_votes_voter ON public.presentation_award_votes (voter_user_id);