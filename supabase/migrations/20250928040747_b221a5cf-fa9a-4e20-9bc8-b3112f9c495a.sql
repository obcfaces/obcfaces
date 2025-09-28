-- Update function to show all participants regardless of application approval status
CREATE OR REPLACE FUNCTION public.get_weekly_participants_by_admin_status(weeks_offset integer DEFAULT 0)
 RETURNS TABLE(
   participant_id uuid, 
   user_id uuid, 
   contest_id uuid, 
   first_name text, 
   last_name text, 
   display_name text, 
   photo_1_url text, 
   photo_2_url text, 
   avatar_url text, 
   age integer, 
   country text, 
   state text, 
   city text, 
   height_cm integer, 
   weight_kg numeric, 
   gender text, 
   marital_status text, 
   has_children boolean, 
   average_rating numeric, 
   total_votes integer, 
   final_rank integer, 
   participant_type text, 
   contest_start_date date, 
   contest_end_date date, 
   contest_title text, 
   contest_status text, 
   admin_status text, 
   is_active boolean
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    wcp.contest_id,
    COALESCE(wcp.application_data->>'first_name', p.first_name) as first_name,
    COALESCE(wcp.application_data->>'last_name', p.last_name) as last_name,
    p.display_name,
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
    p.avatar_url,
    CASE 
      WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - (wcp.application_data->>'birth_year')::INTEGER
      WHEN wcp.application_data->>'age' IS NOT NULL THEN
        (wcp.application_data->>'age')::INTEGER
      ELSE p.age
    END as age,
    COALESCE(wcp.application_data->>'country', p.country) as country,
    COALESCE(wcp.application_data->>'state', p.state) as state,
    COALESCE(wcp.application_data->>'city', p.city) as city,
    COALESCE((wcp.application_data->>'height_cm')::INTEGER, p.height_cm) as height_cm,
    COALESCE((wcp.application_data->>'weight_kg')::NUMERIC, p.weight_kg) as weight_kg,
    COALESCE(wcp.application_data->>'gender', p.gender) as gender,
    COALESCE(wcp.application_data->>'marital_status', p.marital_status) as marital_status,
    COALESCE((wcp.application_data->>'has_children')::BOOLEAN, p.has_children) as has_children,
    COALESCE(wcp.average_rating, 0) as average_rating,
    COALESCE(wcp.total_votes, 0) as total_votes,
    wcp.final_rank,
    CASE 
      WHEN wcp.final_rank = 1 THEN 'winner'
      WHEN wcp.final_rank IS NOT NULL THEN 'finalist'
      ELSE COALESCE(p.participant_type, 'candidate')
    END as participant_type,
    wc.week_start_date as contest_start_date,
    wc.week_end_date as contest_end_date,
    wc.title as contest_title,
    wc.status as contest_status,
    COALESCE(wcp.admin_status, 'this week') as admin_status,
    COALESCE(wcp.is_active, true) as is_active
  FROM weekly_contest_participants wcp
  LEFT JOIN profiles p ON p.id = wcp.user_id
  LEFT JOIN weekly_contests wc ON wc.id = wcp.contest_id
  WHERE wcp.is_active = true
  ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC NULLS LAST;
$function$