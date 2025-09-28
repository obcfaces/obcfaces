-- Fix the DISTINCT issue by removing it and adding group by
CREATE OR REPLACE FUNCTION public.get_next_week_participants_public()
RETURNS TABLE(
  participant_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  age integer,
  city text,
  country text,
  photo_1_url text,
  photo_2_url text,
  height_cm integer,
  weight_kg numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    COALESCE(wcp.application_data->>'first_name', '') as first_name,
    COALESCE(wcp.application_data->>'last_name', '') as last_name,
    COALESCE(
      CASE 
        WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
          EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - (wcp.application_data->>'birth_year')::INTEGER
        WHEN wcp.application_data->>'age' IS NOT NULL THEN
          (wcp.application_data->>'age')::INTEGER
        ELSE NULL
      END, 0
    ) as age,
    COALESCE(wcp.application_data->>'city', '') as city,
    COALESCE(wcp.application_data->>'country', '') as country,
    COALESCE(
      wcp.application_data->>'photo1_url', 
      wcp.application_data->>'photo_1_url',
      ''
    ) as photo_1_url,
    COALESCE(
      wcp.application_data->>'photo2_url', 
      wcp.application_data->>'photo_2_url',
      ''
    ) as photo_2_url,
    COALESCE((wcp.application_data->>'height_cm')::INTEGER, 0) as height_cm,
    COALESCE((wcp.application_data->>'weight_kg')::NUMERIC, 0) as weight_kg
  FROM weekly_contest_participants wcp
  WHERE wcp.is_active = true
    AND wcp.admin_status IN ('next week', 'next week on site')
    -- Accept any application that is not deleted and has valid data
    AND EXISTS (
      SELECT 1 
      FROM contest_applications ca 
      WHERE ca.user_id = wcp.user_id 
        AND ca.is_active = true 
        AND ca.deleted_at IS NULL
        AND ca.application_data IS NOT NULL
    )
  ORDER BY wcp.average_rating DESC NULLS LAST, wcp.total_votes DESC NULLS LAST;
END;
$$;