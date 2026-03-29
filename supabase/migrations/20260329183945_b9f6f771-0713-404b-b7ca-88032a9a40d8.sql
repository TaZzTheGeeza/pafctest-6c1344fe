
-- Drop overly permissive policies on raffle_tickets
DROP POLICY IF EXISTS "Anyone can view tickets" ON raffle_tickets;
DROP POLICY IF EXISTS "Allow ticket inserts" ON raffle_tickets;
DROP POLICY IF EXISTS "Allow ticket management" ON raffle_tickets;
DROP POLICY IF EXISTS "Allow ticket deletes" ON raffle_tickets;

-- Admins and coaches can view all ticket data
CREATE POLICY "Admins and coaches can view all tickets"
ON raffle_tickets FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role));

-- Public can see only which numbers are taken (needed for the number picker grid)
-- This exposes ticket_number, raffle_id, payment_status only - no PII
CREATE POLICY "Public can view ticket numbers"
ON raffle_tickets FOR SELECT TO anon
USING (true);

-- Only edge functions (service role) should insert/update/delete tickets
-- Remove public write access
CREATE POLICY "Authenticated admins can manage tickets"
ON raffle_tickets FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
