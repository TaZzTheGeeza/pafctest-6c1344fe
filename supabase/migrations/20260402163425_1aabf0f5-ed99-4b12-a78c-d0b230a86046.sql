
-- Add photo_url and role columns to player_stats
ALTER TABLE public.player_stats 
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS position text;

-- Create storage bucket for player trading card photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for player-photos bucket
CREATE POLICY "Anyone can view player photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-photos');

CREATE POLICY "Coaches and admins can upload player photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'player-photos' 
  AND (
    public.has_role(auth.uid(), 'coach') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Coaches and admins can update player photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'player-photos' 
  AND (
    public.has_role(auth.uid(), 'coach') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Coaches and admins can delete player photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'player-photos' 
  AND (
    public.has_role(auth.uid(), 'coach') 
    OR public.has_role(auth.uid(), 'admin')
  )
);
