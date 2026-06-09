
CREATE TABLE public.whats_new_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'What''s New',
  bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.whats_new_campaigns TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.whats_new_campaigns TO authenticated;
GRANT ALL ON public.whats_new_campaigns TO service_role;

ALTER TABLE public.whats_new_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active campaigns"
  ON public.whats_new_campaigns FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert campaigns"
  ON public.whats_new_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update campaigns"
  ON public.whats_new_campaigns FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete campaigns"
  ON public.whats_new_campaigns FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX whats_new_only_one_active
  ON public.whats_new_campaigns (is_active)
  WHERE is_active = true;

CREATE TRIGGER whats_new_set_updated_at
  BEFORE UPDATE ON public.whats_new_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
