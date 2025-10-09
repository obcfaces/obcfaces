-- Create function to save fingerprint data for new OAuth users
CREATE OR REPLACE FUNCTION public.save_oauth_user_fingerprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_name TEXT;
BEGIN
  -- Only process OAuth users (not email/password)
  provider_name := NEW.raw_app_meta_data->>'provider';
  
  IF provider_name IS NOT NULL AND provider_name != 'email' THEN
    -- Store fingerprint data in raw_user_meta_data for later retrieval
    -- The actual fingerprint will be saved by client-side code after login
    RAISE NOTICE 'OAuth user created with provider: %', provider_name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_oauth_user_created ON auth.users;
CREATE TRIGGER on_oauth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.save_oauth_user_fingerprint();