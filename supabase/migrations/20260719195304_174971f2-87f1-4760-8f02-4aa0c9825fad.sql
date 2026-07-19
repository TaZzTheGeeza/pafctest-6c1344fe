-- Remove World Cup Sweepstake feature

-- Clean up existing sweepstake data before dropping schema
DELETE FROM public.sweepstake_team_assignments;
DELETE FROM public.raffles WHERE sweepstake_mode = true;

-- Remove trigger and table
DROP TRIGGER IF EXISTS update_sweepstake_team_assignments_updated_at ON public.sweepstake_team_assignments;
DROP TABLE IF EXISTS public.sweepstake_team_assignments;

-- Remove sweepstake columns from raffles
ALTER TABLE public.raffles
  DROP COLUMN IF EXISTS sweepstake_mode,
  DROP COLUMN IF EXISTS teams_revealed,
  DROP COLUMN IF EXISTS prize_winner_pence,
  DROP COLUMN IF EXISTS prize_runner_up_pence,
  DROP COLUMN IF EXISTS prize_third_pence,
  DROP COLUMN IF EXISTS prize_golden_boot_pence;