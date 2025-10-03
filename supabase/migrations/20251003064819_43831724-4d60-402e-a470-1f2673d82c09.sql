-- Drop the old function first
DROP FUNCTION IF EXISTS public.get_weekly_contest_participants_admin(integer);

-- Recreate with updated return columns including rejection reason fields
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_admin(weeks_offset integer DEFAULT 0)
 RETURNS TABLE(
  participant_id uuid,
  contest_id uuid, 
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  age integer,
  city text,
  state text,
  country text,
  photo_1_url text,
  photo_2_url text,
  height_cm integer,
  weight_kg numeric,
  gender text,
  marital_status text,
  has_children boolean,
  final_rank integer,
  total_votes integer,
  average_rating numeric,
  admin_status text,
  is_active boolean,
  created_at timestamp with time zone,
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  deleted_at timestamp with time zone,
  week_interval text,
  notes text,
  application_data jsonb,
  rejection_reason_types text[],
  rejection_reason text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    wcp.id as participant_id,
    wcp.contest_id,
    wcp.user_id,
    p.first_name,
    p.last_name,
    p.display_name,
    p.age,
    p.city,
    p.state,
    p.country,
    p.photo_1_url,
    p.photo_2_url,
    p.height_cm,
    p.weight_kg,
    p.gender,
    p.marital_status,
    p.has_children,
    wcp.final_rank,
    wcp.total_votes,
    wcp.average_rating,
    wcp.admin_status::text,
    wcp.is_active,
    wcp.created_at,
    wcp.submitted_at,
    wcp.reviewed_at,
    wcp.reviewed_by,
    wcp.deleted_at,
    wcp.week_interval,
    wcp.notes,
    wcp.application_data,
    wcp.rejection_reason_types,
    wcp.rejection_reason
  FROM public.weekly_contest_participants wcp
  JOIN public.profiles p ON p.id = wcp.user_id
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days')
  ORDER BY COALESCE(wcp.final_rank, 999), wcp.created_at;
$$;