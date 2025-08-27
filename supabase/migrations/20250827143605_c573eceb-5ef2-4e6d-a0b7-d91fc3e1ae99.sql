-- Fix the remaining SECURITY DEFINER function that's causing the linter error
-- The get_weekly_contest_participants function should use SECURITY INVOKER

CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants(weeks_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, user_id uuid, first_name text, last_name text, age integer, city text, country text, photo1_url text, photo2_url text, height_cm integer, weight_kg numeric, final_rank integer, contest_status text, week_start_date date, week_end_date date)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
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

-- Add documentation
COMMENT ON FUNCTION public.get_weekly_contest_participants(integer) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns weekly contest participants with proper access control.';

-- Also verify the other functions have been properly updated
-- Re-create get_contest_leaderboard to ensure it's using SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_contest_leaderboard(contest_week_offset integer DEFAULT 0)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, avg_rating numeric, total_votes bigint, rank_position bigint)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Ensure this is SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT 
    ps.user_id,
    CONCAT(ps.first_name, ' ', ps.last_name) as full_name,
    p.avatar_url,
    ps.avg_rating,
    ps.total_ratings,
    ROW_NUMBER() OVER (ORDER BY ps.avg_rating DESC, ps.total_ratings DESC) as rank_position
  FROM participant_stats ps
  LEFT JOIN profiles p ON p.id = ps.user_id
  JOIN weekly_contests wc ON wc.id = ps.contest_id
  WHERE wc.week_start_date = (
    SELECT week_start_date 
    FROM weekly_contests 
    ORDER BY week_start_date DESC 
    OFFSET ABS(contest_week_offset) 
    LIMIT 1
  )
  ORDER BY ps.avg_rating DESC, ps.total_ratings DESC;
$$;

-- Re-create get_contest_participants to ensure it's using SECURITY INVOKER  
CREATE OR REPLACE FUNCTION public.get_contest_participants()
RETURNS TABLE(id uuid, user_id uuid, first_name text, last_name text, age integer, city text, country text, photo1_url text, photo2_url text, height_cm integer, weight_kg numeric)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Ensure this is SECURITY INVOKER
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