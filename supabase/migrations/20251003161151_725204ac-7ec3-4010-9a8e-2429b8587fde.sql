-- Add user_metadata to get_user_auth_data_admin function to access country and city
DROP FUNCTION IF EXISTS public.get_user_auth_data_admin();

CREATE OR REPLACE FUNCTION public.get_user_auth_data_admin()
RETURNS TABLE(
  user_id uuid, 
  email text, 
  auth_provider text, 
  facebook_data jsonb,
  user_metadata jsonb,
  created_at timestamp with time zone, 
  last_sign_in_at timestamp with time zone, 
  email_confirmed_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    au.id as user_id,
    au.email,
    COALESCE(
      au.raw_app_meta_data->>'provider',
      CASE 
        WHEN au.raw_app_meta_data->'providers' IS NOT NULL 
        THEN au.raw_app_meta_data->'providers'->>0
        ELSE 'email'
      END
    ) as auth_provider,
    CASE 
      WHEN COALESCE(
        au.raw_app_meta_data->>'provider',
        CASE 
          WHEN au.raw_app_meta_data->'providers' IS NOT NULL 
          THEN au.raw_app_meta_data->'providers'->>0
          ELSE 'email'
        END
      ) = 'facebook' 
      THEN au.raw_user_meta_data
      ELSE NULL
    END as facebook_data,
    au.raw_user_meta_data as user_metadata,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
$$;