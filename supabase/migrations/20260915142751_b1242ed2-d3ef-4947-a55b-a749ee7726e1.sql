CREATE POLICY "Admins can update issued kit"
ON public.kit_issues
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete issued kit"
ON public.kit_issues
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));