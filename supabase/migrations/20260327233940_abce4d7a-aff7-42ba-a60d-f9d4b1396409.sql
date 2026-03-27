
CREATE POLICY "Anyone can view draw videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'draw-videos');

CREATE POLICY "Authenticated users can upload draw videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'draw-videos');
