-- Add club entry fields to tournament_teams
ALTER TABLE tournament_teams
  ADD COLUMN IF NOT EXISTS club_name text,
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS club_org_id text,
  ADD COLUMN IF NOT EXISTS secretary_name text,
  ADD COLUMN IF NOT EXISTS secretary_email text,
  ADD COLUMN IF NOT EXISTS secretary_phone text,
  ADD COLUMN IF NOT EXISTS league_division text,
  ADD COLUMN IF NOT EXISTS team_category text DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS whatsapp_contacts jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS consent_rules boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_photography boolean DEFAULT false;

-- Create squad players table
CREATE TABLE IF NOT EXISTS tournament_team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES tournament_teams(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  date_of_birth date NOT NULL,
  shirt_number integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tournament_team_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team players"
  ON tournament_team_players FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert team players"
  ON tournament_team_players FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow team player management"
  ON tournament_team_players FOR ALL TO public
  USING (true) WITH CHECK (true);