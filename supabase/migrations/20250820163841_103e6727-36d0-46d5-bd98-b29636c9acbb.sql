-- Fix search_path warnings for functions
CREATE OR REPLACE FUNCTION public.get_week_monday(input_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN EXTRACT(DOW FROM input_date) = 0 THEN input_date - INTERVAL '6 days'
      ELSE input_date - INTERVAL '1 day' * (EXTRACT(DOW FROM input_date) - 1)
    END::DATE;
$$;

CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants(weeks_offset INTEGER DEFAULT 0)
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
  weight_kg numeric,
  final_rank integer,
  contest_status text,
  week_start_date date,
  week_end_date date
)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    wcp.id,
    wcp.user_id,
    (wcp.application_data->>'first_name')::text as first_name,
    (wcp.application_data->>'last_name')::text as last_name,
    (date_part('year', now()) - (wcp.application_data->>'birth_year')::integer)::integer as age,
    (wcp.application_data->>'city')::text as city,
    CASE 
      WHEN wcp.application_data->>'country' = 'PH' THEN 'Philippines'
      ELSE (wcp.application_data->>'country')::text
    END as country,
    (wcp.application_data->>'photo1_url')::text as photo1_url,
    (wcp.application_data->>'photo2_url')::text as photo2_url,
    (wcp.application_data->>'height_cm')::integer as height_cm,
    (wcp.application_data->>'weight_kg')::numeric as weight_kg,
    wcp.final_rank,
    wc.status as contest_status,
    wc.week_start_date,
    wc.week_end_date
  FROM public.weekly_contest_participants wcp
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days')
  ORDER BY COALESCE(wcp.final_rank, 999), wcp.created_at;
$$;