
-- Allow coaches to view all profiles (needed for adding members to teams)
CREATE POLICY "Coaches can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'coach'::app_role));
