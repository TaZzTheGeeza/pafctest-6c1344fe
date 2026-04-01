
CREATE TABLE public.shopify_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id bigint UNIQUE NOT NULL,
  order_name text NOT NULL,
  order_number bigint,
  email text,
  customer_first_name text,
  customer_last_name text,
  customer_email text,
  financial_status text NOT NULL DEFAULT 'pending',
  fulfillment_status text,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  cancelled_at timestamptz,
  shopify_created_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all orders"
  ON public.shopify_orders
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
