
CREATE OR REPLACE FUNCTION public.pitch_numbers_overlap(_a int, _b int)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    _a = _b
    OR (_a IN (5,6) AND _b IN (1,2,3,4,5,6))
    OR (_b IN (5,6) AND _a IN (1,2,3,4,5,6));
$$;

CREATE OR REPLACE FUNCTION public.enforce_pitch_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_num int;
BEGIN
  IF NEW.status = 'approved' AND NOT COALESCE(NEW.admin_override, false) THEN
    SELECT number INTO new_num FROM public.pitches WHERE id = NEW.pitch_id;
    IF EXISTS (
      SELECT 1
      FROM public.pitch_bookings pb
      JOIN public.pitches p ON p.id = pb.pitch_id
      WHERE pb.status = 'approved'
        AND pb.id <> NEW.id
        AND pb.start_time < NEW.end_time
        AND pb.end_time > NEW.start_time
        AND public.pitch_numbers_overlap(new_num, p.number)
    ) THEN
      RAISE EXCEPTION 'This slot overlaps an existing approved booking on a physically overlapping pitch (9v9/11v11 share space with pitches 1–4)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.check_pitch_conflict(uuid, timestamp with time zone, timestamp with time zone, uuid);

CREATE FUNCTION public.check_pitch_conflict(
  _pitch_id uuid,
  _start timestamp with time zone,
  _end timestamp with time zone,
  _exclude_id uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, start_time timestamp with time zone, end_time timestamp with time zone, opponent text, age_group text, status text, pitch_id uuid, pitch_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH target AS (SELECT number FROM public.pitches WHERE id = _pitch_id)
  SELECT pb.id, pb.start_time, pb.end_time, pb.opponent, pb.age_group, pb.status, pb.pitch_id, p.name
  FROM public.pitch_bookings pb
  JOIN public.pitches p ON p.id = pb.pitch_id
  WHERE pb.status = 'approved'
    AND (_exclude_id IS NULL OR pb.id <> _exclude_id)
    AND pb.start_time < _end
    AND pb.end_time > _start
    AND public.pitch_numbers_overlap((SELECT number FROM target), p.number);
$$;
