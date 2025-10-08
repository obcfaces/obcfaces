-- Add locale column to profiles table for storing user language preference
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS locale text;

-- Add email_verified column to track if email is confirmed
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Add provider_data column to store raw OAuth data for debugging
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS provider_data jsonb;

-- Update handle_new_user trigger to save all available OAuth data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert comprehensive profile data from OAuth providers
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    display_name,
    avatar_url,
    locale,
    email_verified,
    gender,
    provider_data
  )
  VALUES (
    NEW.id,
    -- First name: try given_name (Google) or first_name (Facebook)
    COALESCE(
      NEW.raw_user_meta_data->>'given_name',
      NEW.raw_user_meta_data->>'first_name'
    ),
    -- Last name: try family_name (Google) or last_name (Facebook)
    COALESCE(
      NEW.raw_user_meta_data->>'family_name',
      NEW.raw_user_meta_data->>'last_name'
    ),
    -- Display name: use full name or construct from parts
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(NEW.raw_user_meta_data->>'family_name', NEW.raw_user_meta_data->>'last_name', '')
      )
    ),
    -- Avatar URL: try picture (Google/Facebook) or avatar_url
    COALESCE(
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar_url'
    ),
    -- Language/locale from OAuth
    NEW.raw_user_meta_data->>'locale',
    -- Email verified status (Google provides this)
    COALESCE(
      (NEW.raw_user_meta_data->>'email_verified')::boolean,
      NEW.email_confirmed_at IS NOT NULL
    ),
    -- Gender (Facebook public profile data)
    NEW.raw_user_meta_data->>'gender',
    -- Store complete OAuth metadata for reference
    NEW.raw_user_meta_data
  );
  
  RETURN NEW;
END;
$function$;