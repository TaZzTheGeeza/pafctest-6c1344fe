
-- Tournament photos table
CREATE TABLE public.tournament_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  age_group TEXT,
  caption TEXT,
  preview_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournament photos"
  ON public.tournament_photos FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tournament photos"
  ON public.tournament_photos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Tournament photo purchases table
CREATE TABLE public.tournament_photo_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_id UUID REFERENCES public.tournament_photos(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, photo_id)
);

ALTER TABLE public.tournament_photo_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.tournament_photo_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON public.tournament_photo_purchases FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert purchases"
  ON public.tournament_photo_purchases FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update purchases"
  ON public.tournament_photo_purchases FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Private storage bucket for full-res photos
INSERT INTO storage.buckets (id, name, public) VALUES ('tournament-photos', 'tournament-photos', false);

-- Admins can upload photos
CREATE POLICY "Admins can upload tournament photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tournament-photos' AND has_role(auth.uid(), 'admin'));

-- Admins can delete photos
CREATE POLICY "Admins can delete tournament photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tournament-photos' AND has_role(auth.uid(), 'admin'));

-- Admins can view photos (for management)
CREATE POLICY "Admins can view tournament photos storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'tournament-photos' AND has_role(auth.uid(), 'admin'));
