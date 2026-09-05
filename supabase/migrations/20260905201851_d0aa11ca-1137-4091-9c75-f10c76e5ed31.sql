ALTER TABLE public.venue_address_overrides
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';