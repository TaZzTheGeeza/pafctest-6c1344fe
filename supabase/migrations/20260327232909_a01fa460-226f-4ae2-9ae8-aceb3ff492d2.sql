
ALTER TABLE public.raffles ADD COLUMN draw_started_at timestamptz DEFAULT NULL;
ALTER TABLE public.raffles ADD COLUMN drawn_ticket_number integer DEFAULT NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.raffles;
