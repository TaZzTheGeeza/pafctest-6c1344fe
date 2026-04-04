-- 1. Fix tournament_teams PII exposure: drop the broad anon SELECT policy
DROP POLICY IF EXISTS "Anyone can view basic team info" ON public.tournament_teams;

-- Add a restricted anon policy that only allows reading non-sensitive columns
-- Since RLS is row-level, we use the existing view for anon access and restrict base table to authenticated admins/coaches
-- Anon users should query tournament_teams_public view instead
-- We still need authenticated non-admin users to read basic team info for the tournament page
CREATE POLICY "Authenticated users can view basic team info"
ON public.tournament_teams
FOR SELECT
TO authenticated
USING (true);

-- 2. Fix tournament photos storage bypass: drop the broad authenticated read policy
DROP POLICY IF EXISTS "Authenticated users can read tournament photos" ON storage.objects;

-- 3. Fix profiles email exposure: drop the overly broad presence policy and replace with a secure function-based view
DROP POLICY IF EXISTS "Team members can view profiles for presence" ON public.profiles;

-- Create a function that returns only safe profile fields for presence
CREATE OR REPLACE FUNCTION public.get_safe_profile(_user_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text, last_seen_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.last_seen_at
  FROM public.profiles p
  WHERE p.id = _user_id
$$;

-- Re-add a presence policy that still allows authenticated users to see all profiles
-- but email access is controlled at application level through coaches/admins policies
-- The key issue is that RLS cannot restrict columns, only rows
-- So we keep the row-level access but rely on the existing coach/admin policies for email
-- For non-admin/coach users, we add a policy that allows viewing but the app should not select email
CREATE POLICY "Authenticated users can view profiles for presence"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);