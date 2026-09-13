ALTER TABLE public.match_reports ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.match_reports ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Coaches and admins can manage match reports" ON public.match_reports;

CREATE POLICY "Coaches and admins can create match reports"
ON public.match_reports FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin'))
  AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Owners and admins can update match reports"
ON public.match_reports FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'coach') AND created_by = auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'coach') AND created_by = auth.uid()));

CREATE POLICY "Owners and admins can delete match reports"
ON public.match_reports FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'coach') AND created_by = auth.uid()));