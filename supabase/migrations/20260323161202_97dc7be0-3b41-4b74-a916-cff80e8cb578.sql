CREATE TABLE public.player_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_name TEXT NOT NULL,
  child_dob DATE NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_age_group TEXT NOT NULL,
  previous_club TEXT,
  medical_conditions TEXT,
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.player_registrations
  FOR INSERT TO anon WITH CHECK (true);
