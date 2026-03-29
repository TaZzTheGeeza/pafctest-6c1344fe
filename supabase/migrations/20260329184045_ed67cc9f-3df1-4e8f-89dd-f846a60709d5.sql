
-- Allow admins to read player registrations
CREATE POLICY "Admins can view registrations"
ON player_registrations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage registrations (update/delete)
CREATE POLICY "Admins can manage registrations"
ON player_registrations FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
