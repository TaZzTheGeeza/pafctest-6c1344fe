CREATE TABLE public.pitch_booking_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  from_status text,
  to_status text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pitch_booking_audit TO authenticated;
GRANT ALL ON public.pitch_booking_audit TO service_role;

ALTER TABLE public.pitch_booking_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approvers can view all booking audit"
ON public.pitch_booking_audit FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'fixture_secretary'));

CREATE POLICY "Requesters can view their own booking audit"
ON public.pitch_booking_audit FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pitch_bookings pb
  WHERE pb.id = pitch_booking_audit.booking_id AND pb.requested_by = auth.uid()
));

CREATE INDEX idx_pitch_booking_audit_booking ON public.pitch_booking_audit(booking_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_pitch_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  act text;
  det jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pitch_booking_audit (booking_id, actor_id, action, from_status, to_status, details)
    VALUES (NEW.id, auth.uid(), 'created', NULL, NEW.status,
      jsonb_build_object('pitch_id', NEW.pitch_id, 'start_time', NEW.start_time, 'end_time', NEW.end_time,
                         'age_group', NEW.age_group, 'opponent', NEW.opponent, 'purpose', NEW.purpose,
                         'decline_reason', NEW.decline_reason));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.pitch_booking_audit (booking_id, actor_id, action, from_status, to_status, details)
    VALUES (OLD.id, auth.uid(), 'deleted', OLD.status, NULL, to_jsonb(OLD));
    RETURN OLD;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    act := CASE NEW.status
      WHEN 'approved' THEN 'approved'
      WHEN 'declined' THEN 'declined'
      WHEN 'cancelled' THEN 'cancelled'
      ELSE 'status_changed' END;
    det := det || jsonb_build_object('decline_reason', NEW.decline_reason);
  ELSE
    act := 'edited';
  END IF;

  IF NEW.pitch_id IS DISTINCT FROM OLD.pitch_id THEN
    det := det || jsonb_build_object('pitch_id', jsonb_build_object('from', OLD.pitch_id, 'to', NEW.pitch_id));
  END IF;
  IF NEW.start_time IS DISTINCT FROM OLD.start_time THEN
    det := det || jsonb_build_object('start_time', jsonb_build_object('from', OLD.start_time, 'to', NEW.start_time));
  END IF;
  IF NEW.end_time IS DISTINCT FROM OLD.end_time THEN
    det := det || jsonb_build_object('end_time', jsonb_build_object('from', OLD.end_time, 'to', NEW.end_time));
  END IF;
  IF NEW.opponent IS DISTINCT FROM OLD.opponent THEN
    det := det || jsonb_build_object('opponent', jsonb_build_object('from', OLD.opponent, 'to', NEW.opponent));
  END IF;
  IF NEW.age_group IS DISTINCT FROM OLD.age_group THEN
    det := det || jsonb_build_object('age_group', jsonb_build_object('from', OLD.age_group, 'to', NEW.age_group));
  END IF;
  IF NEW.purpose IS DISTINCT FROM OLD.purpose THEN
    det := det || jsonb_build_object('purpose', jsonb_build_object('from', OLD.purpose, 'to', NEW.purpose));
  END IF;
  IF NEW.notes IS DISTINCT FROM OLD.notes THEN
    det := det || jsonb_build_object('notes', jsonb_build_object('from', OLD.notes, 'to', NEW.notes));
  END IF;

  IF act = 'edited' AND det = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.pitch_booking_audit (booking_id, actor_id, action, from_status, to_status, details)
  VALUES (NEW.id, auth.uid(), act, OLD.status, NEW.status, det);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_pitch_booking_change
AFTER INSERT OR UPDATE OR DELETE ON public.pitch_bookings
FOR EACH ROW EXECUTE FUNCTION public.log_pitch_booking_change();

CREATE OR REPLACE FUNCTION public.lock_approved_pitch_bookings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_approver boolean;
BEGIN
  is_approver := public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'fixture_secretary');
  IF is_approver OR auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'approved' THEN
      RAISE EXCEPTION 'This booking has been approved and can no longer be deleted. Please contact an admin or the fixture secretary.';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'This booking has been approved and can no longer be edited. Please contact an admin or the fixture secretary.';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Only an admin or the fixture secretary can change a booking status.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lock_approved_pitch_bookings
BEFORE UPDATE OR DELETE ON public.pitch_bookings
FOR EACH ROW EXECUTE FUNCTION public.lock_approved_pitch_bookings();