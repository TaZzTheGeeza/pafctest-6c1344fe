DROP POLICY IF EXISTS "Public can view tournament photos" ON public.tournament_photos;

CREATE POLICY "Admins can view tournament photos"
ON public.tournament_photos
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.tournament_photos FROM anon;