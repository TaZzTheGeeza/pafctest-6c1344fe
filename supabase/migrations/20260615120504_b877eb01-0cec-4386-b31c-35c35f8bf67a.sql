ALTER TABLE public.photo_claim_tokens
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_name text,
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'gocardless';

CREATE INDEX IF NOT EXISTS idx_photo_claim_tokens_provider_ref
  ON public.photo_claim_tokens (shopify_order_id);