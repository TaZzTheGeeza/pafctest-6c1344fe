ALTER TABLE public.tournament_photos ADD COLUMN IF NOT EXISTS photo_date date;

CREATE OR REPLACE VIEW public.tournament_photos_public AS
SELECT id, tournament_id, age_group, caption, preview_url, price_cents, created_at, photo_date
FROM public.tournament_photos;