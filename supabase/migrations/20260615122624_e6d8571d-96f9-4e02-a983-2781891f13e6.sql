CREATE POLICY "Admins and treasurers can view photo claims"
ON public.photo_claim_tokens
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'treasurer')
);

GRANT SELECT ON public.photo_claim_tokens TO authenticated;