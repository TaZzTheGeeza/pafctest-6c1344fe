
-- Convert user_roles.role from enum to text
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;

-- Convert role_permissions.role from enum to text
ALTER TABLE public.role_permissions ALTER COLUMN role TYPE text;

-- Create overloaded has_role function accepting text
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create custom_roles table
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  label text NOT NULL,
  color text DEFAULT '#6b7280',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Seed system roles
INSERT INTO public.custom_roles (name, label, color, is_system) VALUES
  ('admin', 'Admin', '#f87171', true),
  ('coach', 'Coach', '#fbbf24', true),
  ('player', 'Player', '#34d399', true),
  ('treasurer', 'Treasurer', '#a78bfa', true),
  ('user', 'User', '#60a5fa', true)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Anyone can view roles
CREATE POLICY "Anyone can view roles" ON public.custom_roles
  FOR SELECT TO public USING (true);

-- Admins can manage roles
CREATE POLICY "Admins can manage roles" ON public.custom_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
