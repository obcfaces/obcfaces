-- Create function to check if email domain is suspicious
CREATE OR REPLACE FUNCTION public.is_suspicious_email_domain(email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(SUBSTRING(email FROM '@(.*)$')) IN (
    'necub.com',
    'fxzig.com', 
    'forexzig.com',
    'denipl.net',
    'denipl.com',
    'yopmail.com',
    'etenx.com',
    'gddcorp.com',
    'tiffincrane.com',
    'aupvs.com'
  );
$$;

-- Create function to assign suspicious role on user creation
CREATE OR REPLACE FUNCTION public.assign_suspicious_role_if_needed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if email domain is suspicious
  IF is_suspicious_email_domain(NEW.email) THEN
    -- Add suspicious role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'suspicious'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign suspicious role on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_assign_suspicious ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_suspicious
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_suspicious_role_if_needed();

-- Assign suspicious role to existing users with suspicious email domains
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'suspicious'::app_role
FROM auth.users au
WHERE is_suspicious_email_domain(au.email)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = au.id AND ur.role = 'suspicious'::app_role
  )
ON CONFLICT (user_id, role) DO NOTHING;