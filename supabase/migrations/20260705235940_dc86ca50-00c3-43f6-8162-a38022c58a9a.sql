DROP POLICY IF EXISTS "Coaches manage any booking" ON public.pitch_bookings;
DROP POLICY IF EXISTS "Coaches delete bookings" ON public.pitch_bookings;

CREATE POLICY "Coaches manage own bookings" ON public.pitch_bookings
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'coach') AND requested_by = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'coach') AND requested_by = auth.uid());

CREATE POLICY "Coaches delete own bookings" ON public.pitch_bookings
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'coach') AND requested_by = auth.uid());