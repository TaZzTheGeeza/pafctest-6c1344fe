
-- Allow admins to delete tournament photos
CREATE POLICY "Admins can delete tournament photos"
ON public.tournament_photos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update tournament photos (edit caption, age group)
CREATE POLICY "Admins can update tournament photos"
ON public.tournament_photos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete from gallery-photos storage
CREATE POLICY "Admins can delete gallery photos storage"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gallery-photos' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete from tournament-photos storage
CREATE POLICY "Admins can delete tournament photos storage"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tournament-photos' AND public.has_role(auth.uid(), 'admin'));
