
ALTER TABLE public.kit_requests DROP CONSTRAINT kit_requests_status_check;
ALTER TABLE public.kit_requests ADD CONSTRAINT kit_requests_status_check
  CHECK (status IN ('pending', 'approved', 'ready', 'handed_out', 'declined', 'cancelled'));

CREATE UNIQUE INDEX kit_requests_unique_pending
  ON public.kit_requests (player_registration_id, kit_item_id)
  WHERE status = 'pending' AND player_registration_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.kit_request_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Parents may only cancel their own pending request; nothing else may change
  IF OLD.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'You can only change your own kit requests';
  END IF;
  IF OLD.status <> 'pending' OR NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'You can only cancel a pending kit request';
  END IF;
  IF NEW.player_name IS DISTINCT FROM OLD.player_name
     OR NEW.kit_item_id IS DISTINCT FROM OLD.kit_item_id
     OR NEW.size IS DISTINCT FROM OLD.size
     OR NEW.reason IS DISTINCT FROM OLD.reason
     OR NEW.reason_detail IS DISTINCT FROM OLD.reason_detail
     OR NEW.chargeable IS DISTINCT FROM OLD.chargeable
     OR NEW.charge_amount IS DISTINCT FROM OLD.charge_amount
     OR NEW.admin_note IS DISTINCT FROM OLD.admin_note
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.handed_out_at IS DISTINCT FROM OLD.handed_out_at THEN
    RAISE EXCEPTION 'Only the status can be changed when cancelling a request';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_kit_request_update_guard
  BEFORE UPDATE ON public.kit_requests
  FOR EACH ROW EXECUTE FUNCTION public.kit_request_update_guard();
