-- Check and fix any remaining functions without search_path

-- Update get_follow_stats function
CREATE OR REPLACE FUNCTION public.get_follow_stats(target_user_id uuid)
RETURNS TABLE(followers_count integer, following_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select
    (select count(*) from public.follows where followee_id = target_user_id) as followers_count,
    (select count(*) from public.follows where follower_id = target_user_id) as following_count
$function$;

-- Update is_following function
CREATE OR REPLACE FUNCTION public.is_following(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select coalesce(
    exists(
      select 1 from public.follows
      where follower_id = auth.uid() and followee_id = target_user_id
    ), false)
$function$;