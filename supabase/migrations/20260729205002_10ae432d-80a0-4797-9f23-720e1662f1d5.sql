-- 1) team_invites: prevent role escalation via invites
DROP POLICY IF EXISTS "Coaches and admins can create team invites" ON public.team_invites;
CREATE POLICY "Coaches and admins can create team invites"
ON public.team_invites FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'coach') AND role IN ('parent', 'player'))
);

DROP POLICY IF EXISTS "Coaches and admins can update team invites" ON public.team_invites;
CREATE POLICY "Coaches and admins can update team invites"
ON public.team_invites FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coach'))
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'coach') AND role IN ('parent', 'player'))
);

-- 2) club_documents: scope sensitive categories to admins / welfare officers
DROP POLICY IF EXISTS "Authenticated users can view club documents" ON public.club_documents;
CREATE POLICY "Members view non-sensitive club documents"
ON public.club_documents FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'welfare_officer')
  OR document_category NOT IN ('safeguarding', 'finance')
);

-- 3) pitch_bookings: restrict reads to requester, coaches and approvers
DROP POLICY IF EXISTS "Authenticated view bookings" ON public.pitch_bookings;
CREATE POLICY "Coaches and approvers view bookings"
ON public.pitch_bookings FOR SELECT TO authenticated
USING (
  requested_by = auth.uid()
  OR public.has_role(auth.uid(), 'coach')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'fixture_secretary')
);