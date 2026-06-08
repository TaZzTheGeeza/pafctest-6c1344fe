ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS entries_open BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE public.tournaments SET entries_open = FALSE WHERE status = 'active';