
CREATE TABLE public.kit_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'outfield' CHECK (category IN ('outfield', 'goalkeeper', 'other')),
  photo_url TEXT,
  sizes TEXT[] NOT NULL DEFAULT '{5XS,4XS,3XS,XXS,XS,S,M,L,XL,XXL,3XL}',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kit_items TO authenticated;
GRANT ALL ON public.kit_items TO service_role;
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in users can view the kit catalogue" ON public.kit_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage the kit catalogue" ON public.kit_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_kit_items_updated_at BEFORE UPDATE ON public.kit_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.kit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  player_registration_id UUID REFERENCES public.player_registrations(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  team_slug TEXT NOT NULL,
  kit_item_id UUID NOT NULL REFERENCES public.kit_items(id) ON DELETE RESTRICT,
  size TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('outgrown', 'damaged', 'lost', 'goalkeeper', 'never_received', 'other')),
  reason_detail TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ready', 'handed_out', 'declined')),
  chargeable BOOLEAN NOT NULL DEFAULT false,
  charge_amount NUMERIC(8,2),
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  handed_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.kit_requests TO authenticated;
GRANT ALL ON public.kit_requests TO service_role;
ALTER TABLE public.kit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own kit requests" ON public.kit_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create kit requests" ON public.kit_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can cancel their own pending requests" ON public.kit_requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_kit_requests_updated_at BEFORE UPDATE ON public.kit_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.kit_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.kit_requests(id) ON DELETE SET NULL,
  player_registration_id UUID REFERENCES public.player_registrations(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  team_slug TEXT,
  kit_item_id UUID REFERENCES public.kit_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  size TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.kit_issues TO authenticated;
GRANT ALL ON public.kit_issues TO service_role;
ALTER TABLE public.kit_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view their own children's issued kit" ON public.kit_issues
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.player_registrations pr
      WHERE pr.id = kit_issues.player_registration_id
        AND (pr.user_id = auth.uid() OR lower(pr.email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())))
    )
    OR EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.parent_user_id = auth.uid()
        AND g.status = 'active'
        AND (kit_issues.player_registration_id IS NULL OR kit_issues.team_slug = g.team_slug)
        AND lower(split_part(trim(g.player_name), ' ', 1)) = lower(split_part(trim(kit_issues.player_name), ' ', 1))
    )
  );
CREATE POLICY "Admins can record issued kit" ON public.kit_issues
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
