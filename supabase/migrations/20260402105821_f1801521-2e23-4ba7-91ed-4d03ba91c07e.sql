
-- Create the gallery-photos public bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-photos', 'gallery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create the tournament-photos private bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('tournament-photos', 'tournament-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to gallery-photos
CREATE POLICY "Authenticated users can upload gallery photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery-photos');

-- Allow public read on gallery-photos
CREATE POLICY "Public can view gallery photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'gallery-photos');

-- Allow authenticated users to upload to tournament-photos
CREATE POLICY "Authenticated users can upload tournament photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tournament-photos');

-- Allow authenticated users to read tournament-photos (for downloads)
CREATE POLICY "Authenticated users can read tournament photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tournament-photos');
