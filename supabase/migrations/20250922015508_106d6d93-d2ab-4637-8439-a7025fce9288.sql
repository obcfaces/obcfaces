-- Find and fix the last function with missing search_path
-- It's likely the get_primary_participant_timezone function

CREATE OR REPLACE FUNCTION public.get_primary_participant_timezone()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  primary_country text;
  timezone_name text;
  current_monday date;
BEGIN
  current_monday := get_week_monday(CURRENT_DATE);
  
  -- Get the most common country among current week's participants
  SELECT country INTO primary_country
  FROM (
    SELECT 
      wcp.application_data->>'country' as country,
      COUNT(*) as participant_count
    FROM weekly_contest_participants wcp
    JOIN weekly_contests wc ON wcp.contest_id = wc.id
    WHERE wc.week_start_date = current_monday
      AND wcp.is_active = true
      AND wcp.application_data->>'country' IS NOT NULL
    GROUP BY wcp.application_data->>'country'
    ORDER BY participant_count DESC
    LIMIT 1
  ) country_stats;
  
  -- Map countries to timezones (add more as needed)
  timezone_name := CASE 
    WHEN primary_country = 'PH' OR primary_country = 'Philippines' THEN 'Asia/Manila'
    WHEN primary_country = 'RU' OR primary_country = 'Russia' THEN 'Europe/Moscow'
    WHEN primary_country = 'UA' OR primary_country = 'Ukraine' THEN 'Europe/Kiev'
    WHEN primary_country = 'BY' OR primary_country = 'Belarus' THEN 'Europe/Minsk'
    WHEN primary_country = 'US' OR primary_country = 'United States' THEN 'America/New_York'
    WHEN primary_country = 'GB' OR primary_country = 'United Kingdom' THEN 'Europe/London'
    WHEN primary_country = 'DE' OR primary_country = 'Germany' THEN 'Europe/Berlin'
    WHEN primary_country = 'FR' OR primary_country = 'France' THEN 'Europe/Paris'
    -- Default to UTC if country not mapped
    ELSE 'UTC'
  END;
  
  RETURN COALESCE(timezone_name, 'UTC');
END;
$function$;