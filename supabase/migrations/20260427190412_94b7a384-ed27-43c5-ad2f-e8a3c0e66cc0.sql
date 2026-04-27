-- Prevent non-admin users from changing seat assignments.
-- Users can still update their own ticket attendee_name/ticket_type, but table_id and seat_number must remain whatever the admin sets (or NULL).

DROP POLICY IF EXISTS "Users update own tickets" ON public.presentation_tickets;

CREATE POLICY "Users update own tickets"
ON public.presentation_tickets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Non-admins can never set a seat themselves; only admins assign seats.
  AND table_id IS NULL
  AND seat_number IS NULL
);

-- Also ensure new tickets created by users start without a seat.
DROP POLICY IF EXISTS "Users insert own tickets" ON public.presentation_tickets;

CREATE POLICY "Users insert own tickets"
ON public.presentation_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND table_id IS NULL
  AND seat_number IS NULL
  AND EXISTS (
    SELECT 1 FROM public.presentation_allocations a
    WHERE a.id = presentation_tickets.allocation_id
      AND a.user_id = auth.uid()
  )
);

-- Clear any seat assignments that users may have set themselves.
-- Admins will reassign via the admin Drag & Drop tool.
-- (Safe to re-run.)
UPDATE public.presentation_tickets t
SET table_id = NULL, seat_number = NULL
WHERE NOT public.has_role(
  COALESCE((SELECT a.user_id FROM public.presentation_allocations a WHERE a.id = t.allocation_id), '00000000-0000-0000-0000-000000000000'::uuid),
  'admin'
)
AND t.table_id IS NOT NULL;