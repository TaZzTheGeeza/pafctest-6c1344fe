ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS campaign text;
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS donor_anonymous boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.shop_orders.donor_anonymous IS 'Public NICU contribution name preference. Existing orders remain anonymous; contact details and donor messages are never public.';
UPDATE public.shop_orders o SET campaign = 'nicu-christmas-2026' WHERE campaign IS NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements(o.items) item WHERE item->>'name' = 'NICU Christmas collection donation' OR EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id::text = item->>'product_id' AND p.tags @> ARRAY['nicu-christmas-2026']::text[]));
CREATE OR REPLACE FUNCTION public.get_nicu_contributions(_offset integer DEFAULT 0)
RETURNS TABLE(display_name text, amount_cents integer, contributed_at timestamptz, total_cents bigint, contribution_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE WHEN o.donor_anonymous THEN 'Anonymous' ELSE COALESCE(NULLIF(left(trim(o.customer_name), 100), ''), 'Anonymous') END,
    o.total_cents, o.created_at, sum(o.total_cents) OVER (), count(*) OVER ()
  FROM public.shop_orders o
  WHERE o.campaign = 'nicu-christmas-2026' AND o.status = 'paid' AND o.total_cents > 0
  ORDER BY o.created_at DESC, o.id DESC
  LIMIT 20 OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;
REVOKE ALL ON FUNCTION public.get_nicu_contributions(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_nicu_contributions(integer) TO anon, authenticated, service_role;