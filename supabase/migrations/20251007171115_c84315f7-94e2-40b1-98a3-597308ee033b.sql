-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_user_auth_data_admin();

-- Create RPC function to get user auth data for admins
CREATE OR REPLACE FUNCTION public.get_user_auth_data_admin()
RETURNS TABLE(
  user_id uuid,
  email text,
  auth_provider text,
  facebook_data jsonb,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone,
  user_metadata jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    id as user_id,
    email,
    COALESCE(
      (raw_app_meta_data->>'provider')::text,
      'email'
    ) as auth_provider,
    CASE 
      WHEN raw_user_meta_data ? 'provider_id' THEN raw_user_meta_data
      ELSE NULL
    END as facebook_data,
    last_sign_in_at,
    email_confirmed_at,
    raw_user_meta_data as user_metadata
  FROM auth.users;
$$;