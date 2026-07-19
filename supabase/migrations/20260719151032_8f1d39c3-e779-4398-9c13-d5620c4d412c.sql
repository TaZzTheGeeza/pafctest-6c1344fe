
CREATE TABLE public.custom_formations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_slug TEXT,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  slots JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_formations TO authenticated;
GRANT ALL ON public.custom_formations TO service_role;

ALTER TABLE public.custom_formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches view own or team custom formations"
  ON public.custom_formations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (team_slug IS NOT NULL AND public.is_team_member(auth.uid(), team_slug))
  );

CREATE POLICY "Users insert own custom formations"
  ON public.custom_formations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own custom formations"
  ON public.custom_formations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own custom formations"
  ON public.custom_formations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_custom_formations_updated_at
  BEFORE UPDATE ON public.custom_formations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
