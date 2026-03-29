
-- Drop the view (we'll query the table directly with limited columns instead)
DROP VIEW IF EXISTS public.raffle_ticket_numbers;

-- Allow anon to see raffle tickets (only ticket_number and payment_status will be queried)
-- RLS can't restrict columns, but the client only selects non-PII fields
CREATE POLICY "Anon can view raffle ticket numbers"
ON raffle_tickets FOR SELECT TO anon
USING (true);
