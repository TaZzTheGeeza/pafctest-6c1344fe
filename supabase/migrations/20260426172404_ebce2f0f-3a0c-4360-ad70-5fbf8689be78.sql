
-- Lock tables 1-4
UPDATE public.presentation_tables
SET is_locked = true
WHERE table_number IN (1, 2, 3, 4);

-- Fix allocation policy: allow up to 3 children
DROP POLICY IF EXISTS "Eligible users can create allocations" ON public.presentation_allocations;
CREATE POLICY "Eligible users can create allocations"
ON public.presentation_allocations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND can_claim_presentation_tickets(auth.uid())
  AND max_adults <= 2
  AND max_children <= 3
);

DROP POLICY IF EXISTS "Users update own allocations" ON public.presentation_allocations;
CREATE POLICY "Users update own allocations"
ON public.presentation_allocations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND max_adults <= 2 AND max_children <= 3);
