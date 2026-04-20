
-- Clean up duplicate child availability votes — keep the most recently updated one per child/fixture
DELETE FROM public.fixture_availability a
USING public.fixture_availability b
WHERE a.responding_for IS NOT NULL
  AND b.responding_for IS NOT NULL
  AND a.team_slug = b.team_slug
  AND a.fixture_date = b.fixture_date
  AND a.opponent = b.opponent
  AND a.responding_for = b.responding_for
  AND (a.updated_at < b.updated_at OR (a.updated_at = b.updated_at AND a.id < b.id));

-- Drop the existing combined unique constraint
ALTER TABLE public.fixture_availability
  DROP CONSTRAINT IF EXISTS fixture_availability_team_date_opponent_user_respondfor_key;

-- Enforce: only one vote per child per fixture (any parent override replaces previous)
CREATE UNIQUE INDEX IF NOT EXISTS fixture_availability_child_unique
  ON public.fixture_availability (team_slug, fixture_date, opponent, responding_for)
  WHERE responding_for IS NOT NULL;

-- Enforce: only one self-vote per user per fixture
CREATE UNIQUE INDEX IF NOT EXISTS fixture_availability_self_unique
  ON public.fixture_availability (team_slug, fixture_date, opponent, user_id)
  WHERE responding_for IS NULL;
