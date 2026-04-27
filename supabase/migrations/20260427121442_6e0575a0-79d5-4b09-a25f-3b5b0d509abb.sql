
-- Tighten allocation cap to 2 children (was 3). Player now counts as 1 of those 2.
DROP POLICY IF EXISTS "Eligible users can create allocations" ON public.presentation_allocations;
CREATE POLICY "Eligible users can create allocations"
ON public.presentation_allocations
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  AND can_claim_presentation_tickets(auth.uid())
  AND (max_adults <= 2)
  AND (max_children <= 2)
  AND (max_children >= 1)
);

DROP POLICY IF EXISTS "Users update own allocations" ON public.presentation_allocations;
CREATE POLICY "Users update own allocations"
ON public.presentation_allocations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  (auth.uid() = user_id)
  AND (max_adults <= 2)
  AND (max_children <= 2)
  AND (max_children >= 1)
);

-- Lower the default child seats per allocation
ALTER TABLE public.presentation_allocations ALTER COLUMN max_children SET DEFAULT 2;
