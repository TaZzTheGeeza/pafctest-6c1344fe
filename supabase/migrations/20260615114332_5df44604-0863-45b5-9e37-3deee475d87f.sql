
CREATE TABLE public.photo_claim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  shopify_order_id text,
  photo_ids uuid[] NOT NULL DEFAULT '{}',
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE INDEX idx_photo_claim_tokens_email ON public.photo_claim_tokens (lower(email));
CREATE INDEX idx_photo_claim_tokens_order ON public.photo_claim_tokens (shopify_order_id);

GRANT ALL ON public.photo_claim_tokens TO service_role;
ALTER TABLE public.photo_claim_tokens ENABLE ROW LEVEL SECURITY;
-- No policies: service role bypasses RLS; no anon/auth direct access.
