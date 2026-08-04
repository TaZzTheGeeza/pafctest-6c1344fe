CREATE TABLE public.pitch_map_layout (
  pitch_number INTEGER PRIMARY KEY,
  cx NUMERIC NOT NULL,
  cy NUMERIC NOT NULL,
  w NUMERIC NOT NULL,
  h NUMERIC NOT NULL,
  rot NUMERIC NOT NULL DEFAULT 0,
  z INTEGER NOT NULL DEFAULT 0,
  label_dx NUMERIC NOT NULL DEFAULT 0,
  label_dy NUMERIC NOT NULL DEFAULT -60,
  label_scale NUMERIC NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pitch_map_layout TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_map_layout TO authenticated;
GRANT ALL ON public.pitch_map_layout TO service_role;

ALTER TABLE public.pitch_map_layout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pitch map layout"
ON public.pitch_map_layout FOR SELECT
USING (true);

CREATE POLICY "Admins can manage pitch map layout"
ON public.pitch_map_layout FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));