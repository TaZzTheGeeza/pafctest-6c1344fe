CREATE POLICY "Allow club photo updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'club-photos')
WITH CHECK (bucket_id = 'club-photos');