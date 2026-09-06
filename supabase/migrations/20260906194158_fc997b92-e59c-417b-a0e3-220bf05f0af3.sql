ALTER TABLE public.shopify_orders ADD COLUMN IF NOT EXISTS progress_status text NOT NULL DEFAULT 'ordered';
ALTER TABLE public.shopify_orders DROP CONSTRAINT IF EXISTS shopify_orders_progress_status_check;
ALTER TABLE public.shopify_orders ADD CONSTRAINT shopify_orders_progress_status_check CHECK (progress_status IN ('ordered','arrived','printed','delivered'));