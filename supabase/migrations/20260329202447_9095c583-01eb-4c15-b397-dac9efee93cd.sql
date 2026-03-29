ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT now();

CREATE POLICY "Users can update own last_seen" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Team members can view profiles for presence" ON public.profiles FOR SELECT TO authenticated USING (true);
