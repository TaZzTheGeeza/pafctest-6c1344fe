-- Drop the existing ALL policy and replace with granular ones
DROP POLICY IF EXISTS "Users can manage own availability" ON public.fixture_availability;

-- SELECT: team members can view team availability (already exists, keep it)
-- INSERT: any authenticated user can insert their own records
CREATE POLICY "Users can insert own availability"
ON public.fixture_availability
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can update records they own OR records for children they are guardian of
CREATE POLICY "Users can update availability"
ON public.fixture_availability
FOR UPDATE
USING (
  auth.uid() = user_id
  OR (
    responding_for IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.parent_user_id = auth.uid()
        AND g.team_slug = fixture_availability.team_slug
        AND LOWER(TRIM(g.player_name)) = LOWER(TRIM(fixture_availability.responding_for))
        AND g.status = 'active'
    )
  )
);

-- DELETE: users can delete records they own OR records for children they are guardian of
CREATE POLICY "Users can delete availability"
ON public.fixture_availability
FOR DELETE
USING (
  auth.uid() = user_id
  OR (
    responding_for IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.parent_user_id = auth.uid()
        AND g.team_slug = fixture_availability.team_slug
        AND LOWER(TRIM(g.player_name)) = LOWER(TRIM(fixture_availability.responding_for))
        AND g.status = 'active'
    )
  )
);