
-- 1. club_documents: require sign-in to view
DROP POLICY IF EXISTS "Anyone can view club documents" ON public.club_documents;
CREATE POLICY "Authenticated users can view club documents"
  ON public.club_documents FOR SELECT TO authenticated USING (true);

-- 2. hub_payments: remove user-managed ALL policy; only admins write; users keep SELECT
DROP POLICY IF EXISTS "Users can manage own payments" ON public.hub_payments;
CREATE POLICY "Admins can manage hub payments"
  ON public.hub_payments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. presentation_tickets: restrict to authenticated users (was public)
DROP POLICY IF EXISTS "Anyone can view seat occupancy" ON public.presentation_tickets;
CREATE POLICY "Authenticated users can view seat occupancy"
  ON public.presentation_tickets FOR SELECT TO authenticated USING (true);

-- 4. profiles: drop blanket policy; scope to self/admin/coach/teammates
DROP POLICY IF EXISTS "Authenticated users can view profiles for presence" ON public.profiles;

CREATE OR REPLACE FUNCTION public.shares_team_with(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.team_slug = tm2.team_slug
    WHERE tm1.user_id = _viewer AND tm2.user_id = _target
  )
$$;

CREATE POLICY "Members can view teammates profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'coach')
    OR public.shares_team_with(auth.uid(), id)
  );

-- 5. tournament_photos: lock storage_path column, switch view to security_invoker
ALTER VIEW public.tournament_photos_public SET (security_invoker = on);

-- Revoke any broad table grants on tournament_photos, then re-grant only non-sensitive columns
REVOKE ALL ON public.tournament_photos FROM anon, authenticated;
GRANT SELECT (id, tournament_id, age_group, caption, preview_url, price_cents, created_at)
  ON public.tournament_photos TO anon, authenticated;
GRANT ALL ON public.tournament_photos TO service_role;

-- Ensure the public view is readable by anon/authenticated
REVOKE ALL ON public.tournament_photos_public FROM anon, authenticated;
GRANT SELECT ON public.tournament_photos_public TO anon, authenticated;

-- Add explicit SELECT policy that allows reading non-sensitive columns (RLS still requires a policy)
DROP POLICY IF EXISTS "Public can view tournament photos" ON public.tournament_photos;
CREATE POLICY "Public can view tournament photos"
  ON public.tournament_photos FOR SELECT TO anon, authenticated USING (true);
