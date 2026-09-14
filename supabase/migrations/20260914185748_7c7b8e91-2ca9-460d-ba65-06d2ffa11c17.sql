GRANT SELECT ON public.kit_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.kit_items TO authenticated;
GRANT ALL ON public.kit_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kit_requests TO authenticated;
GRANT ALL ON public.kit_requests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kit_issues TO authenticated;
GRANT ALL ON public.kit_issues TO service_role;