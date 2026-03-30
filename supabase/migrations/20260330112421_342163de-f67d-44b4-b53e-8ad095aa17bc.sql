DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.fixture_availability'::regclass
    AND contype = 'u';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.fixture_availability DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.fixture_availability 
  ADD CONSTRAINT fixture_availability_team_date_opponent_user_respondfor_key 
  UNIQUE NULLS NOT DISTINCT (team_slug, fixture_date, opponent, user_id, responding_for);