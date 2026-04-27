
-- Release any tickets seated at U6 tables
UPDATE public.presentation_tickets
SET table_id = NULL, seat_number = NULL
WHERE table_id IN (
  SELECT t.id FROM public.presentation_tables t
  JOIN public.presentation_events e ON e.id = t.event_id
  WHERE e.is_active = true AND t.age_group = 'U6'
);

-- Delete U6 tables
DELETE FROM public.presentation_tables
WHERE event_id IN (SELECT id FROM public.presentation_events WHERE is_active = true)
  AND age_group = 'U6';
