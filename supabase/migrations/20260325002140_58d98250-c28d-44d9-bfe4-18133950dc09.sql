
-- 1. Announcements (site-wide banners)
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Allow announcement management" ON public.announcements FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. Player of the Match
CREATE TABLE public.player_of_the_match (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  team_name text NOT NULL,
  age_group text NOT NULL,
  match_description text,
  photo_url text,
  award_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.player_of_the_match ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view potm" ON public.player_of_the_match FOR SELECT TO public USING (true);
CREATE POLICY "Allow potm management" ON public.player_of_the_match FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. Club Calendar Events
CREATE TABLE public.club_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'general',
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  location text,
  team text,
  is_all_day boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.club_events FOR SELECT TO public USING (true);
CREATE POLICY "Allow event management" ON public.club_events FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. Gallery Albums & Photos
CREATE TABLE public.gallery_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_url text,
  event_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view albums" ON public.gallery_albums FOR SELECT TO public USING (true);
CREATE POLICY "Allow album management" ON public.gallery_albums FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid REFERENCES public.gallery_albums(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view photos" ON public.gallery_photos FOR SELECT TO public USING (true);
CREATE POLICY "Allow photo management" ON public.gallery_photos FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Live Matches
CREATE TABLE public.live_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team text NOT NULL,
  away_team text NOT NULL,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  age_group text NOT NULL,
  venue text,
  kickoff_time timestamp with time zone,
  status text NOT NULL DEFAULT 'upcoming',
  match_events jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view live matches" ON public.live_matches FOR SELECT TO public USING (true);
CREATE POLICY "Allow match management" ON public.live_matches FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable realtime for live matches and announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- Storage bucket for gallery and potm photos
INSERT INTO storage.buckets (id, name, public) VALUES ('club-photos', 'club-photos', true);
CREATE POLICY "Anyone can view club photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'club-photos');
CREATE POLICY "Allow club photo uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'club-photos');
CREATE POLICY "Allow club photo deletes" ON storage.objects FOR DELETE TO public USING (bucket_id = 'club-photos');
