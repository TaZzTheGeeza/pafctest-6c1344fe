CREATE TABLE public.presentation_theatre_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.presentation_events(id) ON DELETE CASCADE,
  player_stat_id UUID NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('left','right')),
  row_index INTEGER NOT NULL CHECK (row_index >= 1),
  col_index INTEGER NOT NULL CHECK (col_index >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, side, row_index, col_index),
  UNIQUE (event_id, player_stat_id)
);

CREATE INDEX idx_pres_theatre_event ON public.presentation_theatre_seats(event_id);
CREATE INDEX idx_pres_theatre_player ON public.presentation_theatre_seats(player_stat_id);

ALTER TABLE public.presentation_theatre_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view theatre seats"
ON public.presentation_theatre_seats
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert theatre seats"
ON public.presentation_theatre_seats
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update theatre seats"
ON public.presentation_theatre_seats
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete theatre seats"
ON public.presentation_theatre_seats
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_pres_theatre_updated
BEFORE UPDATE ON public.presentation_theatre_seats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();