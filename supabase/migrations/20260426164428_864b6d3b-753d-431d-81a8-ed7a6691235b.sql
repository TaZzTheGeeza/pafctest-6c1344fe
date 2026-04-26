
-- Helper to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Event configuration table
CREATE TABLE public.presentation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  doors_open_time TEXT NOT NULL,
  start_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  venue_address TEXT,
  dress_code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  seats_per_table INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.presentation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active presentation events" ON public.presentation_events FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage presentation events" ON public.presentation_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Tables (round tables with 10 seats each)
CREATE TABLE public.presentation_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.presentation_events(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  label TEXT,
  is_staff_only BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, table_number)
);
ALTER TABLE public.presentation_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view presentation tables" ON public.presentation_tables FOR SELECT USING (true);
CREATE POLICY "Admins can manage presentation tables" ON public.presentation_tables FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Eligibility helper
CREATE OR REPLACE FUNCTION public.can_claim_presentation_tickets(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guardians WHERE parent_user_id = _user_id AND status = 'active'
  )
  OR has_role(_user_id, 'player')
  OR has_role(_user_id, 'coach')
  OR has_role(_user_id, 'admin');
$$;

-- Allocations
CREATE TABLE public.presentation_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.presentation_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  team_slug TEXT,
  max_adults INTEGER NOT NULL DEFAULT 2,
  max_children INTEGER NOT NULL DEFAULT 2,
  notes TEXT,
  granted_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_presentation_allocations_user ON public.presentation_allocations(user_id, event_id);
CREATE INDEX idx_presentation_allocations_event ON public.presentation_allocations(event_id);
ALTER TABLE public.presentation_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own allocations" ON public.presentation_allocations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));
CREATE POLICY "Eligible users can create allocations" ON public.presentation_allocations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_claim_presentation_tickets(auth.uid()) AND max_adults <= 2 AND max_children <= 2);
CREATE POLICY "Users update own allocations" ON public.presentation_allocations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND max_adults <= 2 AND max_children <= 2);
CREATE POLICY "Users delete own allocations" ON public.presentation_allocations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all allocations" ON public.presentation_allocations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Tickets
CREATE TABLE public.presentation_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID NOT NULL REFERENCES public.presentation_allocations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.presentation_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('adult', 'child')),
  attendee_name TEXT NOT NULL,
  table_id UUID REFERENCES public.presentation_tables(id) ON DELETE SET NULL,
  seat_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, table_id, seat_number)
);
CREATE INDEX idx_presentation_tickets_allocation ON public.presentation_tickets(allocation_id);
CREATE INDEX idx_presentation_tickets_user ON public.presentation_tickets(user_id);
CREATE INDEX idx_presentation_tickets_event ON public.presentation_tickets(event_id);
ALTER TABLE public.presentation_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seat occupancy" ON public.presentation_tickets FOR SELECT USING (true);
CREATE POLICY "Users insert own tickets" ON public.presentation_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.presentation_allocations a WHERE a.id = allocation_id AND a.user_id = auth.uid()
  ));
CREATE POLICY "Users update own tickets" ON public.presentation_tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own tickets" ON public.presentation_tickets FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON public.presentation_tickets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger: prevent non-admins from booking locked tables, enforce caps
CREATE OR REPLACE FUNCTION public.enforce_presentation_seat_rules()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  table_locked BOOLEAN;
  table_staff_only BOOLEAN;
  ticket_count INTEGER;
  alloc RECORD;
BEGIN
  IF NEW.table_id IS NOT NULL AND NOT has_role(auth.uid(), 'admin') THEN
    SELECT is_locked, is_staff_only INTO table_locked, table_staff_only
    FROM public.presentation_tables WHERE id = NEW.table_id;
    IF COALESCE(table_locked, false) OR COALESCE(table_staff_only, false) THEN
      RAISE EXCEPTION 'This table is reserved and cannot be booked';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT max_adults, max_children INTO alloc FROM public.presentation_allocations WHERE id = NEW.allocation_id;
    IF NEW.ticket_type = 'adult' THEN
      SELECT COUNT(*) INTO ticket_count FROM public.presentation_tickets
        WHERE allocation_id = NEW.allocation_id AND ticket_type = 'adult';
      IF ticket_count >= alloc.max_adults THEN
        RAISE EXCEPTION 'Maximum % adult tickets reached for this allocation', alloc.max_adults;
      END IF;
    ELSIF NEW.ticket_type = 'child' THEN
      SELECT COUNT(*) INTO ticket_count FROM public.presentation_tickets
        WHERE allocation_id = NEW.allocation_id AND ticket_type = 'child';
      IF ticket_count >= alloc.max_children THEN
        RAISE EXCEPTION 'Maximum % child tickets reached for this allocation', alloc.max_children;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_presentation_seat_rules
BEFORE INSERT OR UPDATE ON public.presentation_tickets
FOR EACH ROW EXECUTE FUNCTION public.enforce_presentation_seat_rules();

CREATE TRIGGER trg_presentation_events_updated_at BEFORE UPDATE ON public.presentation_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_presentation_allocations_updated_at BEFORE UPDATE ON public.presentation_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_presentation_tickets_updated_at BEFORE UPDATE ON public.presentation_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed event + tables
INSERT INTO public.presentation_events (title, event_date, doors_open_time, start_time, venue, venue_address, dress_code, description, is_active)
VALUES (
  'PAFC Presentation Evening 2026',
  '2026-06-05',
  '6:30pm',
  '7:00pm',
  'Holiday Inn, Thorpe Wood Peterborough',
  'Thorpe Wood, Peterborough PE3 6SG',
  'Smart',
  'Join us to celebrate another fantastic season at Peterborough Athletic FC. Awards, food, dancing and a 360 booth!',
  true
);

INSERT INTO public.presentation_tables (event_id, table_number, label, is_staff_only, is_locked)
SELECT
  (SELECT id FROM public.presentation_events WHERE event_date = '2026-06-05' LIMIT 1),
  n,
  'Table ' || n,
  n IN (2, 3),
  n IN (2, 3)
FROM generate_series(1, 22) AS n;
