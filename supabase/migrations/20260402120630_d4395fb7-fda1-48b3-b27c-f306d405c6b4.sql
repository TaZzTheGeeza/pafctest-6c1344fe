
-- Function to notify admins on new tournament entry
CREATE OR REPLACE FUNCTION public.notify_tournament_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  age_group_name TEXT;
BEGIN
  -- Get the age group name
  SELECT age_group INTO age_group_name
  FROM tournament_age_groups
  WHERE id = NEW.age_group_id;

  -- Insert a hub_notification for every admin
  FOR admin_record IN
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO hub_notifications (user_id, title, message, type, link)
    VALUES (
      admin_record.user_id,
      'New Tournament Entry',
      NEW.team_name || ' (' || COALESCE(age_group_name, 'Unknown') || ') has submitted a tournament entry.',
      'tournament',
      '/tournament-admin'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger on tournament_teams insert
CREATE TRIGGER on_tournament_entry_notify
AFTER INSERT ON public.tournament_teams
FOR EACH ROW
EXECUTE FUNCTION public.notify_tournament_entry();
