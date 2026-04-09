
CREATE TABLE public.venue_address_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_name TEXT NOT NULL UNIQUE,
  full_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_address_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read venue overrides"
  ON public.venue_address_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admins and coaches can manage venue overrides"
  ON public.venue_address_overrides FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coach'));
