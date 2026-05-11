CREATE OR REPLACE FUNCTION public.enforce_presentation_seat_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  table_locked BOOLEAN;
  table_staff_only BOOLEAN;
  ticket_count INTEGER;
  alloc RECORD;
  is_admin BOOLEAN;
BEGIN
  is_admin := has_role(auth.uid(), 'admin');

  IF NEW.table_id IS NOT NULL AND NOT is_admin THEN
    SELECT is_locked, is_staff_only INTO table_locked, table_staff_only
    FROM public.presentation_tables WHERE id = NEW.table_id;
    IF COALESCE(table_locked, false) OR COALESCE(table_staff_only, false) THEN
      RAISE EXCEPTION 'This table is reserved and cannot be booked';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' AND NOT is_admin THEN
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
$function$;