-- Fix the handle_new_user() function to not insert email into profiles table
-- since we removed the email column for security reasons

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert basic profile data without email
  -- Email is stored only in auth.users for security
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    display_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      CONCAT(
        NEW.raw_user_meta_data->>'first_name',
        ' ',
        NEW.raw_user_meta_data->>'last_name'
      )
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();