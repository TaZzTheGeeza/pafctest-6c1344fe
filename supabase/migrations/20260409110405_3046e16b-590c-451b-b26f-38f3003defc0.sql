
-- Table for tracking email invitations
CREATE TABLE public.team_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  team_slug TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'parent',
  invite_token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(email, team_slug)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Coaches/admins can view invites
CREATE POLICY "Coaches and admins can view team invites"
ON public.team_invites FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'coach')
);

-- Coaches/admins can create invites
CREATE POLICY "Coaches and admins can create team invites"
ON public.team_invites FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'coach')
);

-- Coaches/admins can update invites
CREATE POLICY "Coaches and admins can update team invites"
ON public.team_invites FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'coach')
);

-- Function to process pending invites when a user signs up
CREATE OR REPLACE FUNCTION public.process_team_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Find any pending invites for this email
  FOR invite_record IN
    SELECT * FROM public.team_invites
    WHERE email = NEW.email AND status = 'pending'
  LOOP
    -- Add them as a team member
    INSERT INTO public.team_members (user_id, team_slug, role)
    VALUES (NEW.id, invite_record.team_slug, invite_record.role)
    ON CONFLICT DO NOTHING;

    -- Add to user_age_groups if it exists
    BEGIN
      INSERT INTO public.user_age_groups (user_id, age_group)
      VALUES (NEW.id, invite_record.team_slug)
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;

    -- If role is parent, create guardian link
    IF invite_record.role = 'parent' THEN
      INSERT INTO public.guardians (parent_user_id, player_name, team_slug, status)
      VALUES (NEW.id, '', invite_record.team_slug, 'active')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Mark invite as accepted
    UPDATE public.team_invites
    SET status = 'accepted', accepted_at = now()
    WHERE id = invite_record.id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger on profiles insert (fires after handle_new_user creates the profile)
CREATE TRIGGER on_profile_created_process_invites
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.process_team_invite();
