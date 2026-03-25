
-- Table to assign age groups to users (coaches, players, etc.)
CREATE TABLE public.user_age_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age_group text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, age_group)
);

-- Enable RLS
ALTER TABLE public.user_age_groups ENABLE ROW LEVEL SECURITY;

-- Users can view their own age group assignments
CREATE POLICY "Users can view own age groups"
  ON public.user_age_groups
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all age group assignments
CREATE POLICY "Admins can manage age groups"
  ON public.user_age_groups
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
