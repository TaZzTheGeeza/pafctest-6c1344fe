
CREATE TABLE public.club_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  room_code text NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  status text NOT NULL DEFAULT 'scheduled',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.club_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage meetings" ON public.club_meetings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Authenticated users can view meetings" ON public.club_meetings
  FOR SELECT TO authenticated
  USING (true);
