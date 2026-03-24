-- Create storage bucket for raffle images
INSERT INTO storage.buckets (id, name, public) VALUES ('raffle-images', 'raffle-images', true);

-- Allow anyone to view raffle images
CREATE POLICY "Public read access for raffle images" ON storage.objects FOR SELECT USING (bucket_id = 'raffle-images');

-- Allow anyone to upload raffle images (admin auth will be added later)
CREATE POLICY "Allow raffle image uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'raffle-images');

-- Add image_url column to raffles table
ALTER TABLE public.raffles ADD COLUMN image_url text;