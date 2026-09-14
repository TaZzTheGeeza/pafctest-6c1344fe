DROP POLICY IF EXISTS "Parents can view their own children's issued kit" ON public.kit_issues;

CREATE POLICY "Parents can view their own children's issued kit"
ON public.kit_issues
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.player_registrations pr
    WHERE pr.id = kit_issues.player_registration_id
      AND (
        pr.user_id = auth.uid()
        OR lower(pr.email) = lower(auth.jwt() ->> 'email')
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.guardians g
    WHERE g.parent_user_id = auth.uid()
      AND g.status = 'active'
      AND (kit_issues.player_registration_id IS NULL OR kit_issues.team_slug = g.team_slug)
      AND lower(split_part(trim(g.player_name), ' ', 1)) = lower(split_part(trim(kit_issues.player_name), ' ', 1))
  )
);