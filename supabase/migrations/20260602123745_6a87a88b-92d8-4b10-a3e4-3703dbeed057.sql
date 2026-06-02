
DROP POLICY IF EXISTS "Anyone can look up invite by token" ON public.team_invites;

CREATE OR REPLACE FUNCTION public.lookup_invite_team_slug(_token uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT team_slug FROM public.team_invites
  WHERE invite_token = _token AND accepted_at IS NULL
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.lookup_invite_team_slug(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_invite_team_slug(uuid) TO anon, authenticated;

REVOKE SELECT ON public.tournament_teams FROM anon, authenticated;
GRANT SELECT
  (id, age_group_id, team_name, player_count, status, club_name, county,
   club_org_id, league_division, team_category, consent_rules,
   consent_photography, created_at, group_id)
  ON public.tournament_teams TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_tournament_team_contacts(_team_id uuid)
RETURNS TABLE (
  id uuid, manager_name text, manager_email text, manager_phone text,
  secretary_name text, secretary_email text, secretary_phone text,
  whatsapp_contacts jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.manager_name, t.manager_email, t.manager_phone,
         t.secretary_name, t.secretary_email, t.secretary_phone,
         t.whatsapp_contacts
  FROM public.tournament_teams t
  WHERE t.id = _team_id
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coach'));
$$;
REVOKE ALL ON FUNCTION public.get_tournament_team_contacts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tournament_team_contacts(uuid) TO authenticated;

DROP POLICY IF EXISTS "Anyone can insert team players" ON public.tournament_team_players;
DROP POLICY IF EXISTS "Anyone can register teams" ON public.tournament_teams;

DROP POLICY IF EXISTS "Authenticated users can upload gallery photos" ON storage.objects;
CREATE POLICY "Staff can upload gallery photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gallery-photos'
  AND (public.has_role(auth.uid(), 'admin')
       OR public.has_role(auth.uid(), 'coach')
       OR public.has_role(auth.uid(), 'photographer'))
);

DROP POLICY IF EXISTS "Authenticated users can upload registration photos" ON storage.objects;
CREATE POLICY "Users upload own registration photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'registration-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can upload tournament photos" ON storage.objects;
CREATE POLICY "Staff can upload tournament photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tournament-photos'
  AND (public.has_role(auth.uid(), 'admin')
       OR public.has_role(auth.uid(), 'photographer'))
);
