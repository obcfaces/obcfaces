-- Completely drop and recreate the handle_new_user function and trigger
-- This ensures no cached versions exist

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the function from scratch
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile data without email column
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    display_name,
    avatar_url,
    locale,
    email_verified,
    gender,
    provider_data,
    country,
    state,
    city
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'first_name'),
    COALESCE(NEW.raw_user_meta_data->>'family_name', NEW.raw_user_meta_data->>'last_name'),
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(NEW.raw_user_meta_data->>'family_name', NEW.raw_user_meta_data->>'last_name', '')
      )
    ),
    COALESCE(NEW.raw_user_meta_data->>'picture', NEW.raw_user_meta_data->>'avatar_url'),
    NEW.raw_user_meta_data->>'locale',
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, NEW.email_confirmed_at IS NOT NULL),
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data,
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'city'
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();