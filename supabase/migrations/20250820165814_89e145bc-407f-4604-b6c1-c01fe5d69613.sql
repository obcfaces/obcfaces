-- Fix security issue: Remove public access to weekly_contest_participants table
-- and restrict access to only necessary data through secure functions

-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Weekly contest participants are viewable by everyone" ON public.weekly_contest_participants;

-- Remove existing admin policy and recreate it properly
DROP POLICY IF EXISTS "Admins can manage weekly contest participants" ON public.weekly_contest_participants;

-- Create restrictive policies for weekly_contest_participants
CREATE POLICY "Admins can view all weekly contest participants" 
ON public.weekly_contest_participants 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can manage weekly contest participants" 
ON public.weekly_contest_participants 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a secure public function that only returns safe, non-sensitive data
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_public(weeks_offset INTEGER DEFAULT 0)
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
  final_rank integer
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
    wcp.final_rank
  FROM public.weekly_contest_participants wcp
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days')
    AND wc.status IN ('active', 'closed') -- Only show active or closed contests
  ORDER BY COALESCE(wcp.final_rank, 999), wcp.created_at;
$$;

-- Create admin function for admin panel (returns all data including sensitive info)
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_admin(weeks_offset INTEGER DEFAULT 0)
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
  week_end_date date,
  application_data jsonb
)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Only allow admins and moderators to access this function
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
    wc.week_end_date,
    wcp.application_data
  FROM public.weekly_contest_participants wcp
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days')
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  ORDER BY COALESCE(wcp.final_rank, 999), wcp.created_at;
$$;