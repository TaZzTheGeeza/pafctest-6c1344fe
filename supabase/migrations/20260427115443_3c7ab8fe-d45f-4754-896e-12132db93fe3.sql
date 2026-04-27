-- 1. Add columns for age group + grid layout
ALTER TABLE public.presentation_tables
  ADD COLUMN IF NOT EXISTS age_group text,
  ADD COLUMN IF NOT EXISTS row_index integer,
  ADD COLUMN IF NOT EXISTS col_index integer;

-- 2. Update event seats_per_table to 6
UPDATE public.presentation_events
SET seats_per_table = 6
WHERE is_active = true;

-- 3. Detach existing tickets from old tables (don't delete tickets/allocations)
UPDATE public.presentation_tickets
SET table_id = NULL, seat_number = NULL;

-- 4. Wipe old tables and recreate the new layout
DELETE FROM public.presentation_tables
WHERE event_id = (SELECT id FROM public.presentation_events WHERE is_active = true LIMIT 1);

-- 5. Insert 80 tables: 10 rows × 8 columns, one age group per row
WITH ev AS (
  SELECT id FROM public.presentation_events WHERE is_active = true LIMIT 1
),
ag(row_idx, age_group) AS (
  VALUES
    (1, 'U7'),
    (2, 'U8 Gold'),
    (3, 'U8 Black'),
    (4, 'U9'),
    (5, 'U10'),
    (6, 'U11 Gold'),
    (7, 'U11 Black'),
    (8, 'U13 Gold'),
    (9, 'U13 Black'),
    (10, 'U14')
),
cols AS (
  SELECT generate_series(1, 8) AS col_idx
)
INSERT INTO public.presentation_tables
  (event_id, table_number, label, age_group, row_index, col_index, is_locked, is_staff_only)
SELECT
  ev.id,
  ((ag.row_idx - 1) * 8 + cols.col_idx) AS table_number,
  ag.age_group || ' · Table ' || cols.col_idx AS label,
  ag.age_group,
  ag.row_idx,
  cols.col_idx,
  false,
  false
FROM ev, ag, cols
ORDER BY ag.row_idx, cols.col_idx;