CREATE POLICY "Coaches manage any booking" ON public.pitch_bookings
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'coach'))
WITH CHECK (public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches delete bookings" ON public.pitch_bookings
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'coach'));