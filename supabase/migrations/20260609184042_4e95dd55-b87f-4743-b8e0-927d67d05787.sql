CREATE OR REPLACE FUNCTION public.expire_pending_raffle_tickets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.raffle_tickets
  WHERE payment_status = 'pending'
    AND created_at < now() - interval '30 minutes';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('expire-pending-raffle-tickets');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-pending-raffle-tickets',
  '*/5 * * * *',
  $$SELECT public.expire_pending_raffle_tickets();$$
);