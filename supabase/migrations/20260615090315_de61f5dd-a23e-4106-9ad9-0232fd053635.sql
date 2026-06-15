ALTER TABLE public.tournament_photos
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tournament_photos_featured
  ON public.tournament_photos (featured, featured_at DESC) WHERE featured = true;

CREATE OR REPLACE VIEW public.tournament_photos_public AS
SELECT id, tournament_id, age_group, caption, preview_url, price_cents, created_at, photo_date, featured, featured_at
FROM public.tournament_photos;