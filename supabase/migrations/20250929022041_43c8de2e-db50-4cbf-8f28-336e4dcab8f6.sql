-- Исправляем типы данных в функции
DROP FUNCTION IF EXISTS public.get_weekly_contest_participants_public(integer);

CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_public(weeks_offset integer DEFAULT 0)
RETURNS TABLE(
  participant_id uuid, 
  user_id uuid, 
  first_name text, 
  last_name text, 
  age numeric, 
  city text, 
  country text, 
  photo_1_url text, 
  photo_2_url text, 
  height_cm integer, 
  weight_kg numeric, 
  final_rank integer, 
  total_votes integer, 
  average_rating numeric, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_status text;
BEGIN
  -- Определяем статус участников на основе offset
  CASE 
    WHEN weeks_offset = 0 THEN target_status := 'this week';
    WHEN weeks_offset = -1 THEN target_status := 'past week 1';
    WHEN weeks_offset = -2 THEN target_status := 'past week 2';
    WHEN weeks_offset = -3 THEN target_status := 'past week 3';
    WHEN weeks_offset = 1 THEN target_status := 'next week on site';
    ELSE target_status := 'this week';
  END CASE;

  RETURN QUERY
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    COALESCE(wcp.application_data->>'first_name', p.first_name) as first_name,
    COALESCE(wcp.application_data->>'last_name', p.last_name) as last_name,
    -- Fix age calculation: current year minus birth year
    CASE 
      WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - (wcp.application_data->>'birth_year')::INTEGER
      WHEN p.birthdate IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.birthdate)
      ELSE p.age::numeric
    END as age,
    COALESCE(wcp.application_data->>'city', p.city) as city,
    CASE 
      WHEN COALESCE(wcp.application_data->>'country', p.country) = 'PH' THEN 'Philippines'
      ELSE COALESCE(wcp.application_data->>'country', p.country)
    END as country,
    COALESCE(wcp.application_data->>'photo1_url', p.photo_1_url) as photo_1_url,
    COALESCE(wcp.application_data->>'photo2_url', p.photo_2_url) as photo_2_url,
    COALESCE((wcp.application_data->>'height_cm')::INTEGER, p.height_cm) as height_cm,
    COALESCE((wcp.application_data->>'weight_kg')::NUMERIC, p.weight_kg) as weight_kg,
    wcp.final_rank,
    COALESCE(wcp.total_votes, 0) as total_votes,
    COALESCE(wcp.average_rating, 0) as average_rating,
    wcp.created_at
  FROM weekly_contest_participants wcp
  LEFT JOIN profiles p ON p.id = wcp.user_id
  WHERE wcp.is_active = true
    AND wcp.admin_status = target_status
    AND EXISTS (
      SELECT 1 
      FROM contest_applications ca 
      WHERE ca.user_id = wcp.user_id 
        AND ca.status = 'approved' 
        AND ca.is_active = true 
        AND ca.deleted_at IS NULL
    )
  ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC NULLS LAST, wcp.total_votes DESC NULLS LAST;
END;
$function$;