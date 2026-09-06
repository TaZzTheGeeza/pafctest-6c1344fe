ALTER TABLE public.shopify_orders ADD COLUMN IF NOT EXISTS admin_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;
GRANT SELECT, UPDATE ON public.shopify_orders TO authenticated;
GRANT ALL ON public.shopify_orders TO service_role;
DROP POLICY IF EXISTS "Admins can update orders" ON public.shopify_orders;
CREATE POLICY "Admins can update orders" ON public.shopify_orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));