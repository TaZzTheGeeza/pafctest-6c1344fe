
-- 1. Deduplicate existing parents_player votes: keep most recent per (voter_user_id, team_slug)
DELETE FROM public.presentation_award_votes v
USING public.presentation_award_votes v2
WHERE v.award_type = 'parents_player'
  AND v2.award_type = 'parents_player'
  AND v.voter_user_id = v2.voter_user_id
  AND v.team_slug = v2.team_slug
  AND v.created_at < v2.created_at;

-- 2. Replace uniqueness: drop blanket unique, add per-award partial uniques
ALTER TABLE public.presentation_award_votes
  DROP CONSTRAINT IF EXISTS presentation_award_votes_responding_for_team_slug_award_typ_key;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_paw_votes_players_player
  ON public.presentation_award_votes (responding_for, team_slug)
  WHERE award_type = 'players_player';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_paw_votes_parents_player
  ON public.presentation_award_votes (voter_user_id, team_slug)
  WHERE award_type = 'parents_player';

-- 3. Update INSERT RLS: allow parents_player as long as user has any active guardian on the team
DROP POLICY IF EXISTS "Linked guardian can insert vote" ON public.presentation_award_votes;

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
    AND (
      (
        presentation_award_votes.award_type = 'players_player'
        AND EXISTS (
          SELECT 1 FROM public.guardians g
          WHERE g.parent_user_id = auth.uid()
            AND g.team_slug = presentation_award_votes.team_slug
            AND lower(trim(g.player_name)) = lower(trim(presentation_award_votes.responding_for))
            AND g.status = 'active'
        )
      )
      OR (
        presentation_award_votes.award_type = 'parents_player'
        AND EXISTS (
          SELECT 1 FROM public.guardians g
          WHERE g.parent_user_id = auth.uid()
            AND g.team_slug = presentation_award_votes.team_slug
            AND g.status = 'active'
        )
      )
    )
  );
