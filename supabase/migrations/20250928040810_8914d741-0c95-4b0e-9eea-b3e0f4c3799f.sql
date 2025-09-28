-- Create a simpler function for public access to next week participants
CREATE OR REPLACE FUNCTION public.get_next_week_participants_public()
 RETURNS TABLE(
   participant_id uuid, 
   user_id uuid, 
   first_name text, 
   last_name text, 
   photo_1_url text, 
   photo_2_url text, 
   age integer, 
   country text, 
   city text, 
   height_cm integer, 
   weight_kg numeric, 
   admin_status text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    COALESCE(wcp.application_data->>'first_name', p.first_name) as first_name,
    COALESCE(wcp.application_data->>'last_name', p.last_name) as last_name,
    COALESCE(
      wcp.application_data->>'photo1_url', 
      wcp.application_data->>'photo_1_url',
      p.photo_1_url
    ) as photo_1_url,
    COALESCE(
      wcp.application_data->>'photo2_url', 
      wcp.application_data->>'photo_2_url',
      p.photo_2_url
    ) as photo_2_url,
    CASE 
      WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - (wcp.application_data->>'birth_year')::INTEGER
      WHEN wcp.application_data->>'age' IS NOT NULL THEN
        (wcp.application_data->>'age')::INTEGER
      ELSE p.age
    END as age,
    COALESCE(wcp.application_data->>'country', p.country) as country,
    COALESCE(wcp.application_data->>'city', p.city) as city,
    COALESCE((wcp.application_data->>'height_cm')::INTEGER, p.height_cm) as height_cm,
    COALESCE((wcp.application_data->>'weight_kg')::NUMERIC, p.weight_kg) as weight_kg,
    COALESCE(wcp.admin_status, 'this week') as admin_status
  FROM weekly_contest_participants wcp
  LEFT JOIN profiles p ON p.id = wcp.user_id
  WHERE wcp.is_active = true
    AND wcp.admin_status IN ('next week', 'next week on site')
  ORDER BY wcp.average_rating DESC NULLS LAST;
$function$