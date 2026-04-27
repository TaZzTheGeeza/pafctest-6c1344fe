DROP POLICY IF EXISTS "Eligible users can create allocations" ON public.presentation_allocations;
CREATE POLICY "Eligible users can create allocations"
ON public.presentation_allocations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND can_claim_presentation_tickets(auth.uid())
  AND max_adults >= 0 AND max_adults <= 2
  AND max_children >= 0 AND max_children <= 2
);

DROP POLICY IF EXISTS "Users update own allocations" ON public.presentation_allocations;
CREATE POLICY "Users update own allocations"
ON public.presentation_allocations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND max_adults >= 0 AND max_adults <= 2
  AND max_children >= 0 AND max_children <= 2
);