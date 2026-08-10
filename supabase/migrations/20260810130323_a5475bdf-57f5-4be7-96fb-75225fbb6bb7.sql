CREATE OR REPLACE FUNCTION public.get_approved_pitch_allocations(_team_slug text)
RETURNS TABLE(fa_fixture_id text, opponent text, start_time timestamptz, end_time timestamptz, pitch_number int, pitch_name text, pitch_format text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pb.fa_fixture_id, pb.opponent, pb.start_time, pb.end_time, p.number, p.name, p.format
  FROM public.pitch_bookings pb
  JOIN public.pitches p ON p.id = pb.pitch_id
  WHERE pb.status = 'approved'
    AND pb.fa_fixture_id IS NOT NULL
    AND split_part(pb.fa_fixture_id, '|', 1) = public.canonical_team_slug(_team_slug)
    AND auth.uid() IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_approved_pitch_allocations(text) TO authenticated;