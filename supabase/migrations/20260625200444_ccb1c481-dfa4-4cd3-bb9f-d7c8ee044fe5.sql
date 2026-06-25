
ALTER TABLE public.gallery_albums ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','hub'));

DROP POLICY IF EXISTS "Anyone can view albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Anyone can view photos" ON public.gallery_photos;

CREATE POLICY "View albums by visibility" ON public.gallery_albums
FOR SELECT USING (
  visibility = 'public' OR auth.uid() IS NOT NULL
);

CREATE POLICY "View photos by album visibility" ON public.gallery_photos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.gallery_albums a
    WHERE a.id = gallery_photos.album_id
      AND (a.visibility = 'public' OR auth.uid() IS NOT NULL)
  )
);

GRANT SELECT ON public.gallery_albums TO anon;
GRANT SELECT ON public.gallery_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_albums TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_photos TO authenticated;
GRANT ALL ON public.gallery_albums TO service_role;
GRANT ALL ON public.gallery_photos TO service_role;
