-- 1) Add an auto-incrementing human-readable reference to every tournament photo
CREATE SEQUENCE IF NOT EXISTS public.tournament_photo_ref_seq START 1000;
GRANT USAGE ON SEQUENCE public.tournament_photo_ref_seq TO authenticated, service_role;

ALTER TABLE public.tournament_photos
  ADD COLUMN IF NOT EXISTS photo_ref text;

-- Backfill existing rows
UPDATE public.tournament_photos
SET photo_ref = 'PHOTO-' || lpad(nextval('public.tournament_photo_ref_seq')::text, 6, '0')
WHERE photo_ref IS NULL;

-- Apply default and constraints
ALTER TABLE public.tournament_photos
  ALTER COLUMN photo_ref SET DEFAULT 'PHOTO-' || lpad(nextval('public.tournament_photo_ref_seq')::text, 6, '0');

ALTER TABLE public.tournament_photos
  ALTER COLUMN photo_ref SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tournament_photos_photo_ref_key
  ON public.tournament_photos (photo_ref);

-- 2) Expose photo_ref through the public view used by the gallery
CREATE OR REPLACE VIEW public.tournament_photos_public AS
SELECT id, tournament_id, age_group, caption, preview_url,
       price_cents, created_at, photo_date, featured, featured_at, photo_ref
FROM public.tournament_photos;

GRANT SELECT ON public.tournament_photos_public TO anon, authenticated;

-- 3) Track the gross amount on each photo claim so the Finances board can show it
ALTER TABLE public.photo_claim_tokens
  ADD COLUMN IF NOT EXISTS total_cents integer NOT NULL DEFAULT 0;