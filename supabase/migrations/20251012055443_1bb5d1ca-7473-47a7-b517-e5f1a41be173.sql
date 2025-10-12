-- Create function to handle new OAuth users
CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
BEGIN
  -- Only process new users (INSERT) who don't have a profile yet
  IF TG_OP = 'INSERT' AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) THEN
    -- Extract name from user metadata
    user_full_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Split full name into first and last
    user_first_name := SPLIT_PART(user_full_name, ' ', 1);
    user_last_name := TRIM(SUBSTRING(user_full_name FROM LENGTH(user_first_name) + 1));
    
    -- Create profile with OAuth data
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      first_name,
      last_name,
      avatar_url,
      email_verified,
      provider_data,
      is_approved
    ) VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_first_name,
      NULLIF(user_last_name, ''),
      COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
      ),
      COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false),
      jsonb_build_object(
        'provider', NEW.raw_app_meta_data->>'provider',
        'provider_id', COALESCE(
          NEW.raw_user_meta_data->>'provider_id',
          NEW.raw_user_meta_data->>'sub'
        ),
        'full_metadata', NEW.raw_user_meta_data
      ),
      NULL -- Will require admin approval
    );
    
    RAISE NOTICE 'Created profile for OAuth user: % (provider: %)', 
      NEW.id, 
      NEW.raw_app_meta_data->>'provider';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_oauth_user();