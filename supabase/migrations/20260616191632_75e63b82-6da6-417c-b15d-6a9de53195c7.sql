DO $$
DECLARE
  rec RECORD;
  v_key TEXT;
  v_url TEXT := 'https://scfiodwfvpjqgfmekqwg.supabase.co/functions/v1/send-transactional-email';
  v_title TEXT := 'Action Required: Player Registration – Deadline Tue 30 June 2026';
  v_msg TEXT := E'Hi,\n\nThis is a quick reminder that every PAFC player must be registered for the 2026/27 season by Tuesday 30 June 2026.\n\nThe league won''t accept late registrations and any child not signed off won''t be eligible to play in the opening fixtures, so please get this done as soon as you can — it only takes 5 minutes.\n\nHow to register:\n1. Go to https://www.pa-fc.uk/register\n2. Sign in or create your free PAFC account\n3. Fill in your child''s details (DOB, medical info, emergency contact, FA Fan Number if you have one)\n4. Upload a clear head-and-shoulders photo of your child\n5. Submit — you''ll get a confirmation email\n\nIf you have more than one child at the club, please complete a separate registration for each player.\n\nAny issues, just reply to this email or message Ben and we''ll help you through it.\n\nThanks for getting this sorted early — it makes a huge difference to getting the season started smoothly.\n\nUp the Lions! 🦁';
BEGIN
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Vault secret email_queue_service_role_key not found';
  END IF;

  FOR rec IN
    SELECT DISTINCT p.email
    FROM public.guardians g
    JOIN public.profiles p ON p.id = g.parent_user_id
    WHERE g.status = 'active'
      AND p.email IS NOT NULL AND p.email <> ''
      AND NOT EXISTS (
        SELECT 1 FROM public.player_registrations pr
        WHERE pr.guardian_id = g.id
           OR (lower(pr.child_name) = lower(g.player_name) AND pr.email = p.email)
      )
  LOOP
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := jsonb_build_object(
        'templateName', 'admin-broadcast',
        'recipientEmail', rec.email,
        'idempotencyKey', 'reg-reminder-2026-' || rec.email,
        'templateData', jsonb_build_object('title', v_title, 'message', v_msg)
      )
    );
  END LOOP;
END $$;