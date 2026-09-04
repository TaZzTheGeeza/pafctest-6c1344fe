CREATE POLICY "Users view own registration photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'registration-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own registration photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'registration-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'registration-photos' AND (storage.foldername(name))[1] = auth.uid()::text);