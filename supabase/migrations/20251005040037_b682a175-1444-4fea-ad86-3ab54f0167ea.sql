-- Create function to get email domain statistics
CREATE OR REPLACE FUNCTION public.get_email_domain_stats()
RETURNS TABLE(domain text, user_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    LOWER(SUBSTRING(email FROM '@(.*)$')) as domain,
    COUNT(*) as user_count
  FROM auth.users
  WHERE email IS NOT NULL
  GROUP BY domain
  ORDER BY user_count DESC, domain ASC;
$$;