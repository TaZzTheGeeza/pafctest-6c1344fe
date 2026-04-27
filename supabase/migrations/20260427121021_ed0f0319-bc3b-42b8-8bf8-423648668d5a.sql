
-- Clear existing seat assignments and tables for the active event
UPDATE public.presentation_tickets SET table_id = NULL, seat_number = NULL
WHERE allocation_id IN (
  SELECT a.id FROM public.presentation_allocations a
  JOIN public.presentation_events e ON e.id = a.event_id
  WHERE e.is_active = true
);

DELETE FROM public.presentation_tables
WHERE event_id IN (SELECT id FROM public.presentation_events WHERE is_active = true);

-- Insert 80 tables in a 10-col × 8-row grid, allocated to age groups in order
WITH ev AS (
  SELECT id FROM public.presentation_events WHERE is_active = true LIMIT 1
),
age_alloc(age_group, tbl_count, ord) AS (
  VALUES
    ('U6', 4, 1),
    ('U7', 6, 2),
    ('U8 Gold', 7, 3),
    ('U8 Black', 6, 4),
    ('U9', 8, 5),
    ('U10', 8, 6),
    ('U11 Gold', 10, 7),
    ('U11 Black', 10, 8),
    ('U13 Gold', 7, 9),
    ('U13 Black', 7, 10),
    ('U14', 7, 11)
),
expanded AS (
  SELECT
    age_group,
    ord,
    generate_series(1, tbl_count) AS within_idx
  FROM age_alloc
),
numbered AS (
  SELECT
    age_group,
    ROW_NUMBER() OVER (ORDER BY ord, within_idx) AS table_number,
    ROW_NUMBER() OVER (PARTITION BY age_group ORDER BY within_idx) AS group_seq
  FROM expanded
)
INSERT INTO public.presentation_tables (event_id, table_number, label, age_group, row_index, col_index)
SELECT
  ev.id,
  n.table_number,
  n.age_group || ' · Table ' || n.group_seq,
  n.age_group,
  CEIL(n.table_number::numeric / 10)::int AS row_index,
  ((n.table_number - 1) % 10 + 1)::int AS col_index
FROM numbered n, ev;
