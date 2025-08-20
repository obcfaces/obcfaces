-- Remove the unsafe policy that exposes personal data
DROP POLICY IF EXISTS "Everyone can view approved applications" ON public.contest_applications;

-- Create a secure function that returns only safe public data for contest display
CREATE OR REPLACE FUNCTION public.get_contest_participants()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  age integer,
  city text,
  country text,
  photo1_url text,
  photo2_url text,
  height_cm integer,
  weight_kg numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ca.id,
    ca.user_id,
    (ca.application_data->>'first_name')::text as first_name,
    (ca.application_data->>'last_name')::text as last_name,
    (date_part('year', now()) - (ca.application_data->>'birth_year')::integer)::integer as age,
    (ca.application_data->>'city')::text as city,
    CASE 
      WHEN ca.application_data->>'country' = 'PH' THEN 'Philippines'
      ELSE (ca.application_data->>'country')::text
    END as country,
    (ca.application_data->>'photo1_url')::text as photo1_url,
    (ca.application_data->>'photo2_url')::text as photo2_url,
    (ca.application_data->>'height_cm')::integer as height_cm,
    (ca.application_data->>'weight_kg')::numeric as weight_kg
  FROM public.contest_applications ca
  WHERE ca.status = 'approved'
  ORDER BY ca.created_at DESC
  LIMIT 20;
$$;