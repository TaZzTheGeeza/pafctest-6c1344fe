-- 1) Update physical overlap rules for the current pitch set.
-- Active pitches are numbered 7..12 and displayed as 1..6.
-- Displayed pitches 1,2,3 (numbers 7,8,9) are nested and overlap each other.
CREATE OR REPLACE FUNCTION public.pitch_numbers_overlap(_a integer, _b integer)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT
    _a = _b
    -- current ground: nested 11v11 / 9v9 / 5v5 (displayed as pitches 1, 2, 3)
    OR (_a IN (7,8,9) AND _b IN (7,8,9))
    -- legacy layout: 9v9 and 11v11 shared space with pitches 1-4
    OR (_a IN (5,6) AND _b IN (1,2,3,4,5,6))
    OR (_b IN (5,6) AND _a IN (1,2,3,4,5,6));
$$;

-- 2) Force every new booking to await approval, and auto-decline clashes on insert.
CREATE OR REPLACE FUNCTION public.pitch_booking_intake()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_num int;
  clash RECORD;
BEGIN
  NEW.status := 'pending';
  NEW.decided_by := NULL;
  NEW.decided_at := NULL;
  NEW.decline_reason := NULL;

  SELECT number INTO new_num FROM public.pitches WHERE id = NEW.pitch_id;

  SELECT pb.id, p.name INTO clash
  FROM public.pitch_bookings pb
  JOIN public.pitches p ON p.id = pb.pitch_id
  WHERE pb.status = 'approved'
    AND pb.start_time < NEW.end_time
    AND pb.end_time > NEW.start_time
    AND public.pitch_numbers_overlap(new_num, p.number)
  LIMIT 1;

  IF FOUND THEN
    NEW.status := 'declined';
    NEW.decided_at := now();
    NEW.decline_reason := 'Automatically declined: clashes with an approved booking on ' || COALESCE(clash.name, 'an overlapping pitch');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pitch_booking_intake ON public.pitch_bookings;
CREATE TRIGGER trg_pitch_booking_intake
  BEFORE INSERT ON public.pitch_bookings
  FOR EACH ROW EXECUTE FUNCTION public.pitch_booking_intake();

-- 3) When a booking is approved, auto-decline every pending request that clashes with it.
CREATE OR REPLACE FUNCTION public.auto_decline_clashing_bookings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_num int;
  pitch_label text;
BEGIN
  IF NEW.status <> 'approved' OR (TG_OP = 'UPDATE' AND OLD.status = 'approved') THEN
    RETURN NEW;
  END IF;

  SELECT number, name INTO new_num, pitch_label FROM public.pitches WHERE id = NEW.pitch_id;

  UPDATE public.pitch_bookings pb
  SET status = 'declined',
      decided_at = now(),
      decline_reason = 'Automatically declined: clashes with an approved booking on ' || COALESCE(pitch_label, 'an overlapping pitch')
  FROM public.pitches p
  WHERE p.id = pb.pitch_id
    AND pb.status = 'pending'
    AND pb.id <> NEW.id
    AND pb.start_time < NEW.end_time
    AND pb.end_time > NEW.start_time
    AND public.pitch_numbers_overlap(new_num, p.number);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_decline_clashing_bookings ON public.pitch_bookings;
CREATE TRIGGER trg_auto_decline_clashing_bookings
  AFTER UPDATE OF status ON public.pitch_bookings
  FOR EACH ROW EXECUTE FUNCTION public.auto_decline_clashing_bookings();