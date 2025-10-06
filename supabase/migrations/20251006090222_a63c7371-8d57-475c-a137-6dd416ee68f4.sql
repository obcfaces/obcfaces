-- Drop and recreate get_weekly_contest_participants_admin with rejection fields
DROP FUNCTION IF EXISTS public.get_weekly_contest_participants_admin(integer);

CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_admin(weeks_offset integer DEFAULT 0)
 RETURNS TABLE(
   participant_id uuid, 
   contest_id uuid, 
   user_id uuid, 
   first_name text, 
   last_name text, 
   age integer, 
   country text, 
   state text, 
   city text, 
   height_cm integer, 
   weight_kg numeric, 
   gender text, 
   marital_status text, 
   has_children boolean, 
   photo_1_url text, 
   photo_2_url text, 
   avatar_url text, 
   final_rank integer, 
   total_votes integer, 
   average_rating numeric, 
   status_assigned_date timestamp with time zone, 
   contest_start_date date, 
   is_active boolean, 
   admin_status participant_admin_status, 
   status_history jsonb, 
   week_interval text, 
   created_at timestamp with time zone, 
   submitted_at timestamp with time zone, 
   deleted_at timestamp with time zone,
   rejection_reason_types text[],
   rejection_reason text,
   reviewed_at timestamp with time zone,
   reviewed_by uuid
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    wcp.id as participant_id,
    wcp.contest_id,
    wcp.user_id,
    (wcp.application_data->>'first_name')::text as first_name,
    (wcp.application_data->>'last_name')::text as last_name,
    (wcp.application_data->>'age')::integer as age,
    (wcp.application_data->>'country')::text as country,
    (wcp.application_data->>'state')::text as state,
    (wcp.application_data->>'city')::text as city,
    (wcp.application_data->>'height_cm')::integer as height_cm,
    (wcp.application_data->>'weight_kg')::numeric as weight_kg,
    (wcp.application_data->>'gender')::text as gender,
    (wcp.application_data->>'marital_status')::text as marital_status,
    (wcp.application_data->>'has_children')::boolean as has_children,
    COALESCE(
      (wcp.application_data->>'photo1_url')::text,
      (wcp.application_data->>'photo_1_url')::text
    ) as photo_1_url,
    COALESCE(
      (wcp.application_data->>'photo2_url')::text,
      (wcp.application_data->>'photo_2_url')::text
    ) as photo_2_url,
    (wcp.application_data->>'avatar_url')::text as avatar_url,
    wcp.final_rank,
    wcp.total_votes,
    wcp.average_rating,
    wcp.created_at as status_assigned_date,
    wc.week_start_date as contest_start_date,
    wcp.is_active,
    wcp.admin_status,
    wcp.status_history,
    wcp.week_interval,
    wcp.created_at,
    wcp.submitted_at,
    wcp.deleted_at,
    wcp.rejection_reason_types,
    wcp.rejection_reason,
    wcp.reviewed_at,
    wcp.reviewed_by
  FROM public.weekly_contest_participants wcp
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days')
  ORDER BY COALESCE(wcp.final_rank, 999), wcp.created_at;
$function$;