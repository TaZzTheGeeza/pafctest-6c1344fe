CREATE OR REPLACE FUNCTION public.notify_new_pitch_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approver record;
  pitch_name text;
BEGIN
  IF NEW.status <> 'pending' THEN RETURN NEW; END IF;
  SELECT name INTO pitch_name FROM public.pitches WHERE id = NEW.pitch_id;
  FOR approver IN SELECT DISTINCT user_id FROM public.user_roles WHERE role::text IN ('admin','fixture_secretary') LOOP
    INSERT INTO public.hub_notifications (user_id, title, message, type, link)
    VALUES (
      approver.user_id,
      'New pitch booking request',
      COALESCE(pitch_name,'Pitch') || ' - ' || to_char(NEW.start_time AT TIME ZONE 'Europe/London', 'Dy DD Mon HH24:MI')
        || COALESCE(' vs ' || NEW.opponent, '') || COALESCE(' (' || NEW.age_group || ')', ''),
      'pitch_booking',
      '/pitch-bookings-admin?booking=' || NEW.id::text
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_pitch_booking_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pitch_name text;
BEGIN
  IF OLD.status = NEW.status OR NEW.requested_by IS NULL THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('approved','declined','cancelled') THEN RETURN NEW; END IF;
  SELECT name INTO pitch_name FROM public.pitches WHERE id = NEW.pitch_id;
  INSERT INTO public.hub_notifications (user_id, title, message, type, link)
  VALUES (
    NEW.requested_by,
    'Pitch booking ' || NEW.status,
    COALESCE(pitch_name,'Pitch') || ' - ' || to_char(NEW.start_time AT TIME ZONE 'Europe/London', 'Dy DD Mon HH24:MI')
      || CASE WHEN NEW.status = 'declined' AND NEW.decline_reason IS NOT NULL THEN E'\nReason: ' || NEW.decline_reason ELSE '' END,
    'pitch_booking',
    '/pitch-bookings?booking=' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_tournament_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record record;
  age_group_name text;
  tournament_id_value uuid;
BEGIN
  SELECT age_group, tournament_id INTO age_group_name, tournament_id_value
  FROM public.tournament_age_groups WHERE id = NEW.age_group_id;
  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role::text = 'admin' LOOP
    INSERT INTO public.hub_notifications (user_id, title, message, type, link)
    VALUES (
      admin_record.user_id,
      'New Tournament Entry',
      NEW.team_name || ' (' || COALESCE(age_group_name, 'Unknown') || ') has submitted a tournament entry.',
      'tournament',
      '/tournament-admin?tournament=' || tournament_id_value::text || '&team=' || NEW.id::text
    );
  END LOOP;
  RETURN NEW;
END;
$$;