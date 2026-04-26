
ALTER TABLE public.player_registrations
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS gocardless_billing_request_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_player_registrations_payment_status
  ON public.player_registrations(payment_status);

CREATE INDEX IF NOT EXISTS idx_player_registrations_gc_billing_request
  ON public.player_registrations(gocardless_billing_request_id);
