-- Allow multiple contest applications per user
-- Remove unique constraint on user_id in weekly_contest_participants if it exists
-- and update functions to work with participant_id instead of just user_id

-- First, let's update the weekly_contest_participants table to allow multiple entries per user
-- Add a unique constraint for user_id + contest_id combination instead
ALTER TABLE public.weekly_contest_participants 
DROP CONSTRAINT IF EXISTS weekly_contest_participants_user_id_key;

-- Add unique constraint for user + contest combination (user can participate once per contest)
ALTER TABLE public.weekly_contest_participants 
ADD CONSTRAINT unique_user_contest 
UNIQUE (user_id, contest_id);

-- Update contest_applications to allow multiple applications per user
-- Remove any unique constraint on user_id if it exists
ALTER TABLE public.contest_applications 
DROP CONSTRAINT IF EXISTS contest_applications_user_id_key;

-- Update contestant_ratings to work with participant_id instead of just contestant_user_id
ALTER TABLE public.contestant_ratings 
ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES public.weekly_contest_participants(id);

-- Create index for participant_id in ratings
CREATE INDEX IF NOT EXISTS idx_contestant_ratings_participant_id 
ON public.contestant_ratings(participant_id);

-- Update likes table to support participant-specific likes
-- Add participant_id to likes for more granular control
ALTER TABLE public.likes 
ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES public.weekly_contest_participants(id);

-- Create index for participant_id in likes
CREATE INDEX IF NOT EXISTS idx_likes_participant_id 
ON public.likes(participant_id);

-- Update photo_comments to support participant-specific comments
ALTER TABLE public.photo_comments 
ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES public.weekly_contest_participants(id);

-- Create index for participant_id in comments
CREATE INDEX IF NOT EXISTS idx_photo_comments_participant_id 
ON public.photo_comments(participant_id);

-- Update get_weekly_contest_participants_public function to return participant_id
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_public(weeks_offset integer DEFAULT 0)
RETURNS TABLE(
  participant_id uuid, 
  user_id uuid, 
  contest_id uuid, 
  first_name text, 
  last_name text, 
  display_name text, 
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
  participant_type text, 
  average_rating numeric, 
  total_votes integer, 
  final_rank integer, 
  contest_start_date date, 
  contest_end_date date, 
  contest_title text, 
  contest_status text
)
LANGUAGE sql
STABLE
AS $function$
  WITH target_contest AS (
    SELECT 
      id,
      title,
      status,
      week_start_date,
      week_end_date
    FROM weekly_contests 
    WHERE week_start_date = (
      SELECT week_start_date 
      FROM weekly_contests 
      ORDER BY week_start_date DESC 
      OFFSET ABS(weeks_offset) 
      LIMIT 1
    )
  )
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    wcp.contest_id,
    COALESCE(wcp.application_data->>'first_name', p.first_name) as first_name,
    COALESCE(wcp.application_data->>'last_name', p.last_name) as last_name,
    p.display_name,
    -- Fix age calculation: current year minus birth year
    CASE 
      WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - (wcp.application_data->>'birth_year')::INTEGER
      WHEN p.birthdate IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.birthdate)
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
    COALESCE(wcp.application_data->>'photo1_url', p.photo_1_url) as photo_1_url,
    COALESCE(wcp.application_data->>'photo2_url', p.photo_2_url) as photo_2_url,
    p.avatar_url,
    CASE 
      WHEN wcp.final_rank = 1 THEN 'winner'
      WHEN wcp.final_rank IS NOT NULL THEN 'finalist'
      ELSE COALESCE(p.participant_type, 'candidate')
    END as participant_type,
    COALESCE(wcp.average_rating, 0) as average_rating,
    COALESCE(wcp.total_votes, 0) as total_votes,
    wcp.final_rank,
    tc.week_start_date as contest_start_date,
    tc.week_end_date as contest_end_date,
    tc.title as contest_title,
    tc.status as contest_status
  FROM target_contest tc
  JOIN weekly_contest_participants wcp ON wcp.contest_id = tc.id
  LEFT JOIN profiles p ON p.id = wcp.user_id
  WHERE wcp.is_active = true
    AND EXISTS (
      SELECT 1 FROM contest_applications ca 
      WHERE ca.user_id = wcp.user_id 
      AND ca.status = 'approved'
      AND ca.is_active = true
    )
  ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC NULLS LAST;
$function$;

-- Create function to get participant rating stats by participant_id
CREATE OR REPLACE FUNCTION public.get_participant_rating_stats(participant_id_param uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint, user_has_voted boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*) as total_votes,
    EXISTS(
      SELECT 1 FROM contestant_ratings 
      WHERE participant_id = participant_id_param 
        AND user_id = auth.uid()
    ) as user_has_voted
  FROM contestant_ratings 
  WHERE participant_id = participant_id_param;
$function$;

-- Create function to get my rating for a specific participant
CREATE OR REPLACE FUNCTION public.get_my_rating_for_participant(participant_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT rating 
  FROM contestant_ratings 
  WHERE participant_id = participant_id_param 
    AND user_id = auth.uid()
  LIMIT 1;
$function$;

-- Create function to check if user liked a specific participant
CREATE OR REPLACE FUNCTION public.check_user_liked_participant_id(participant_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 
    FROM likes 
    WHERE user_id = auth.uid()
      AND participant_id = participant_id_param
  );
$function$;

-- Create function to get participant likes count
CREATE OR REPLACE FUNCTION public.get_participant_likes_count(participant_id_param uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)
  FROM likes 
  WHERE participant_id = participant_id_param;
$function$;

-- Create function to get participant comments count
CREATE OR REPLACE FUNCTION public.get_participant_comments_count(participant_id_param uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)
  FROM photo_comments 
  WHERE participant_id = participant_id_param;
$function$;

-- Update trigger to work with participant_id
CREATE OR REPLACE FUNCTION public.update_participant_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    avg_rating NUMERIC;
    vote_count INTEGER;
    target_participant_id UUID;
BEGIN
    -- Get the participant_id from the rating record
    target_participant_id := COALESCE(NEW.participant_id, OLD.participant_id);
    
    -- Skip if no participant_id
    IF target_participant_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate new average rating and total votes for this participant
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, vote_count
    FROM contestant_ratings 
    WHERE participant_id = target_participant_id;
    
    -- Update the weekly contest participant record
    UPDATE weekly_contest_participants 
    SET 
        average_rating = avg_rating,
        total_votes = vote_count
    WHERE id = target_participant_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS update_contest_participant_rating ON contestant_ratings;
CREATE TRIGGER update_participant_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON contestant_ratings
FOR EACH ROW EXECUTE FUNCTION update_participant_rating();