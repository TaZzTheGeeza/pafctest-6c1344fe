DELETE FROM public.fixture_availability
WHERE responding_for IS NULL
  AND user_id NOT IN (
    SELECT user_id FROM public.user_roles WHERE role IN ('coach', 'admin')
  );