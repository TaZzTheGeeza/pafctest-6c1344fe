-- Raffles table
CREATE TABLE public.raffles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  prize_description text NOT NULL,
  ticket_price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'gbp',
  max_tickets integer,
  draw_date timestamptz,
  status text NOT NULL DEFAULT 'draft',
  stripe_price_id text,
  stripe_product_id text,
  winner_ticket_id uuid,
  winner_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Raffle tickets table
CREATE TABLE public.raffle_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text,
  ticket_number integer NOT NULL,
  stripe_payment_intent_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_tickets ENABLE ROW LEVEL SECURITY;

-- Public can view active raffles
CREATE POLICY "Anyone can view active raffles" ON public.raffles
  FOR SELECT USING (status IN ('active', 'drawn'));

-- Public can view tickets
CREATE POLICY "Anyone can view tickets" ON public.raffle_tickets
  FOR SELECT USING (true);

-- Allow inserts on tickets (edge function uses service role for payments)
CREATE POLICY "Allow ticket inserts" ON public.raffle_tickets
  FOR INSERT WITH CHECK (true);

-- Allow raffle management (will be locked down with admin auth later)
CREATE POLICY "Allow raffle management" ON public.raffles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow ticket management" ON public.raffle_tickets
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow ticket deletes" ON public.raffle_tickets
  FOR DELETE USING (true);

-- Indexes
CREATE INDEX idx_raffle_tickets_raffle_id ON public.raffle_tickets(raffle_id);
CREATE INDEX idx_raffle_tickets_email ON public.raffle_tickets(buyer_email);