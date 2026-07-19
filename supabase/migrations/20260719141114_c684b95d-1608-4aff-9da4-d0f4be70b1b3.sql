
ALTER TABLE public.team_selections
  ADD COLUMN IF NOT EXISTS positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS formation_format text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS opposition_formation text,
  ADD COLUMN IF NOT EXISTS captain_id uuid,
  ADD COLUMN IF NOT EXISTS vice_captain_id uuid,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_selections_status_chk') THEN
    ALTER TABLE public.team_selections
      ADD CONSTRAINT team_selections_status_chk CHECK (status IN ('draft','published'));
  END IF;
END $$;
