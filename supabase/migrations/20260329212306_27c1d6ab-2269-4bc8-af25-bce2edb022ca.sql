
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      NULLIF(TRIM(
        CONCAT_WS(' ',
          NEW.raw_user_meta_data->>'first_name',
          NEW.raw_user_meta_data->>'last_name'
        )
      ), ''),
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;
