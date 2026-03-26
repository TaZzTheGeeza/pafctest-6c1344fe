
-- Hub Channels (per-team chat rooms)
CREATE TABLE public.hub_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  team_slug text,
  channel_type text NOT NULL DEFAULT 'team',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.hub_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view channels" ON public.hub_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches and admins can manage channels" ON public.hub_channels FOR ALL TO authenticated USING (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin'));

-- Hub Messages
CREATE TABLE public.hub_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.hub_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hub_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view messages" ON public.hub_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can send messages" ON public.hub_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.hub_messages FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.hub_messages;

-- Hub Payment Requests (coach creates a fee for the team)
CREATE TABLE public.hub_payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'gbp',
  team_slug text,
  due_date date,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hub_payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view payment requests" ON public.hub_payment_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches and admins can manage payment requests" ON public.hub_payment_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin'));

-- Hub Payments (tracks who paid)
CREATE TABLE public.hub_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.hub_payment_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, user_id)
);
ALTER TABLE public.hub_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.hub_payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own payments" ON public.hub_payments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hub Notifications
CREATE TABLE public.hub_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hub_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.hub_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.hub_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.hub_notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.hub_notifications;
