
-- 1. Fixture Secretary role in custom_roles
INSERT INTO public.custom_roles (name, label, color, is_system)
VALUES ('fixture_secretary', 'Fixture Secretary', '#f59e0b', false)
ON CONFLICT (name) DO NOTHING;

-- Seed permissions for fixture_secretary
INSERT INTO public.role_permissions (role, permission, enabled)
VALUES
  ('fixture_secretary', 'page.pitch_bookings_admin', true),
  ('fixture_secretary', 'action.approve_pitch_bookings', true),
  ('fixture_secretary', 'action.manage_pitch_bookings', true),
  ('coach', 'action.request_pitch_booking', true),
  ('admin', 'page.pitch_bookings_admin', true),
  ('admin', 'action.approve_pitch_bookings', true),
  ('admin', 'action.manage_pitch_bookings', true)
ON CONFLICT DO NOTHING;

-- 2. Pitches table
CREATE TABLE public.pitches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  format TEXT NOT NULL, -- '5v5' | '7v7' | '9v9' | '11v11'
  suggested_age_groups TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pitches TO authenticated;
GRANT ALL ON public.pitches TO service_role;

ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view pitches"
  ON public.pitches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage pitches"
  ON public.pitches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed the 6 pitches (matches the uploaded ground layout)
INSERT INTO public.pitches (number, name, format, suggested_age_groups) VALUES
  (1, 'Pitch 1', '7v7', ARRAY['u9s','u9s-black','u9s-gold','u10s']),
  (2, 'Pitch 2', '5v5', ARRAY['u6s','u7s','u8s']),
  (3, 'Pitch 3', '7v7', ARRAY['u9s','u9s-black','u9s-gold','u10s']),
  (4, 'Pitch 4', '5v5', ARRAY['u6s','u7s','u8s']),
  (5, 'Pitch 5', '9v9', ARRAY['u11s','u11s-black','u11s-gold','u12s-black','u12s-gold']),
  (6, 'Pitch 6', '11v11', ARRAY['u13s','u13s-black','u13s-gold','u14s','u14s-black','u14s-gold','u15s']);

-- 3. Pitch bookings table
CREATE TABLE public.pitch_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID NOT NULL REFERENCES public.pitches(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'match', -- match | training | friendly | cup | other
  age_group TEXT,
  team_slug TEXT,
  opponent TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | declined | cancelled
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  decline_reason TEXT,
  fa_fixture_id TEXT,
  admin_override BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_status CHECK (status IN ('pending','approved','declined','cancelled')),
  CONSTRAINT valid_purpose CHECK (purpose IN ('match','training','friendly','cup','other'))
);

CREATE INDEX idx_pitch_bookings_pitch_time ON public.pitch_bookings(pitch_id, start_time, end_time) WHERE status = 'approved';
CREATE INDEX idx_pitch_bookings_status ON public.pitch_bookings(status);
CREATE INDEX idx_pitch_bookings_requester ON public.pitch_bookings(requested_by);
CREATE UNIQUE INDEX idx_pitch_bookings_fa_fixture ON public.pitch_bookings(fa_fixture_id) WHERE fa_fixture_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_bookings TO authenticated;
GRANT ALL ON public.pitch_bookings TO service_role;

ALTER TABLE public.pitch_bookings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all non-cancelled bookings (hub visibility)
CREATE POLICY "Authenticated view bookings"
  ON public.pitch_bookings FOR SELECT TO authenticated
  USING (true);

-- Coaches (and admins) can create bookings for themselves
CREATE POLICY "Coaches create own bookings"
  ON public.pitch_bookings FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'coach')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'fixture_secretary')
    )
  );

-- Requester can update their own pending booking (cancel/edit)
CREATE POLICY "Requester updates own pending"
  ON public.pitch_bookings FOR UPDATE TO authenticated
  USING (requested_by = auth.uid() AND status = 'pending')
  WITH CHECK (requested_by = auth.uid());

-- Admin + fixture secretary can update any booking (approve/decline/edit)
CREATE POLICY "Approvers manage any booking"
  ON public.pitch_bookings FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'fixture_secretary')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'fixture_secretary')
  );

-- Admin + fixture secretary can delete
CREATE POLICY "Approvers delete bookings"
  ON public.pitch_bookings FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'fixture_secretary')
  );

-- 4. Conflict check function
CREATE OR REPLACE FUNCTION public.check_pitch_conflict(
  _pitch_id UUID,
  _start TIMESTAMPTZ,
  _end TIMESTAMPTZ,
  _exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, start_time TIMESTAMPTZ, end_time TIMESTAMPTZ, opponent TEXT, age_group TEXT, status TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pb.id, pb.start_time, pb.end_time, pb.opponent, pb.age_group, pb.status
  FROM public.pitch_bookings pb
  WHERE pb.pitch_id = _pitch_id
    AND pb.status = 'approved'
    AND (_exclude_id IS NULL OR pb.id <> _exclude_id)
    AND pb.start_time < _end
    AND pb.end_time > _start
$$;

-- 5. Prevent overlaps on approved bookings via trigger
CREATE OR REPLACE FUNCTION public.enforce_pitch_no_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND NOT COALESCE(NEW.admin_override, false) THEN
    IF EXISTS (
      SELECT 1 FROM public.pitch_bookings
      WHERE pitch_id = NEW.pitch_id
        AND status = 'approved'
        AND id <> NEW.id
        AND start_time < NEW.end_time
        AND end_time > NEW.start_time
    ) THEN
      RAISE EXCEPTION 'This slot overlaps an existing approved booking on this pitch';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pitch_bookings_no_overlap
  BEFORE INSERT OR UPDATE ON public.pitch_bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_pitch_no_overlap();

-- 6. updated_at triggers
CREATE TRIGGER trg_pitches_updated_at
  BEFORE UPDATE ON public.pitches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_pitch_bookings_updated_at
  BEFORE UPDATE ON public.pitch_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Notify admins + fixture secretaries on new pending booking
CREATE OR REPLACE FUNCTION public.notify_new_pitch_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approver RECORD;
  pitch_name TEXT;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT name INTO pitch_name FROM public.pitches WHERE id = NEW.pitch_id;

  FOR approver IN
    SELECT DISTINCT user_id FROM public.user_roles
    WHERE role IN ('admin','fixture_secretary')
  LOOP
    INSERT INTO public.hub_notifications (user_id, title, message, type, link)
    VALUES (
      approver.user_id,
      'New pitch booking request',
      COALESCE(pitch_name,'Pitch') || ' - ' || to_char(NEW.start_time AT TIME ZONE 'Europe/London', 'Dy DD Mon HH24:MI')
        || COALESCE(' vs ' || NEW.opponent, '')
        || COALESCE(' (' || NEW.age_group || ')', ''),
      'pitch_booking',
      '/pitch-bookings-admin'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_pitch_booking
  AFTER INSERT ON public.pitch_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_pitch_booking();

-- 8. Notify requester when their booking is approved/declined
CREATE OR REPLACE FUNCTION public.notify_pitch_booking_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pitch_name TEXT;
BEGIN
  IF OLD.status = NEW.status OR NEW.requested_by IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved','declined','cancelled') THEN
    RETURN NEW;
  END IF;

  SELECT name INTO pitch_name FROM public.pitches WHERE id = NEW.pitch_id;

  INSERT INTO public.hub_notifications (user_id, title, message, type, link)
  VALUES (
    NEW.requested_by,
    'Pitch booking ' || NEW.status,
    COALESCE(pitch_name,'Pitch') || ' - ' || to_char(NEW.start_time AT TIME ZONE 'Europe/London', 'Dy DD Mon HH24:MI')
      || CASE WHEN NEW.status = 'declined' AND NEW.decline_reason IS NOT NULL
              THEN E'\nReason: ' || NEW.decline_reason ELSE '' END,
    'pitch_booking',
    '/pitch-bookings'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_pitch_booking_decision
  AFTER UPDATE OF status ON public.pitch_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_pitch_booking_decision();

-- 9. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pitch_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pitches;
