
-- Tournaments table
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  venue text,
  tournament_date date,
  entry_fee_cents integer DEFAULT 0,
  rules text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tournaments" ON public.tournaments
  FOR SELECT TO public USING (status IN ('active', 'completed'));

CREATE POLICY "Allow tournament management" ON public.tournaments
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Age groups within a tournament
CREATE TABLE public.tournament_age_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  age_group text NOT NULL,
  max_teams integer,
  group_count integer DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_age_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view age groups" ON public.tournament_age_groups
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow age group management" ON public.tournament_age_groups
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Registered teams
CREATE TABLE public.tournament_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_id uuid REFERENCES public.tournament_age_groups(id) ON DELETE CASCADE NOT NULL,
  team_name text NOT NULL,
  manager_name text NOT NULL,
  manager_email text NOT NULL,
  manager_phone text,
  player_count integer,
  status text NOT NULL DEFAULT 'pending',
  group_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" ON public.tournament_teams
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can register teams" ON public.tournament_teams
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow team management" ON public.tournament_teams
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Groups within an age group
CREATE TABLE public.tournament_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_id uuid REFERENCES public.tournament_age_groups(id) ON DELETE CASCADE NOT NULL,
  group_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups" ON public.tournament_groups
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow group management" ON public.tournament_groups
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Add foreign key for team group assignment
ALTER TABLE public.tournament_teams
  ADD CONSTRAINT tournament_teams_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.tournament_groups(id) ON DELETE SET NULL;

-- Matches
CREATE TABLE public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_id uuid REFERENCES public.tournament_age_groups(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES public.tournament_groups(id) ON DELETE SET NULL,
  home_team_id uuid REFERENCES public.tournament_teams(id) ON DELETE CASCADE NOT NULL,
  away_team_id uuid REFERENCES public.tournament_teams(id) ON DELETE CASCADE NOT NULL,
  home_score integer,
  away_score integer,
  match_time timestamptz,
  pitch text,
  stage text NOT NULL DEFAULT 'group',
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches" ON public.tournament_matches
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow match management" ON public.tournament_matches
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Announcements
CREATE TABLE public.tournament_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view announcements" ON public.tournament_announcements
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow announcement management" ON public.tournament_announcements
  FOR ALL TO public USING (true) WITH CHECK (true);
