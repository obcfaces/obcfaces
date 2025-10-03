-- Copy email from auth.users to profiles for all existing users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id 
  AND (p.email IS NULL OR p.email = '');