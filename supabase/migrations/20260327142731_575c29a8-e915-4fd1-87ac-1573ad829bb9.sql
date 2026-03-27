
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-photos', 'registration-photos', true);

CREATE POLICY "Anyone can upload registration photos"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'registration-photos');

CREATE POLICY "Anyone can view registration photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'registration-photos');
