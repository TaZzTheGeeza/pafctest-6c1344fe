GRANT SELECT, INSERT, UPDATE, DELETE ON public.kit_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kit_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kit_issues TO authenticated;
GRANT ALL ON public.kit_items TO service_role;
GRANT ALL ON public.kit_requests TO service_role;
GRANT ALL ON public.kit_issues TO service_role;