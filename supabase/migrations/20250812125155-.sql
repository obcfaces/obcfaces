-- Tighten RLS for follows and add secure RPC helpers

-- 1) Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;

-- 2) Allow users to view only their own follow relationships
CREATE POLICY "Users can view their own follow relationships"
ON public.follows
FOR SELECT
USING (auth.uid() = follower_id OR auth.uid() = followee_id);

-- 3) Create SECURITY DEFINER function to fetch follow counters without exposing identities
CREATE OR REPLACE FUNCTION public.get_follow_stats(target_user_id uuid)
RETURNS TABLE (followers_count integer, following_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select
    (select count(*) from public.follows where followee_id = target_user_id) as followers_count,
    (select count(*) from public.follows where follower_id = target_user_id) as following_count
$$;

GRANT EXECUTE ON FUNCTION public.get_follow_stats(uuid) TO anon, authenticated;

-- 4) Create SECURITY DEFINER function to check if current user follows a target user
CREATE OR REPLACE FUNCTION public.is_following(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select coalesce(
    exists(
      select 1 from public.follows
      where follower_id = auth.uid() and followee_id = target_user_id
    ), false)
$$;

GRANT EXECUTE ON FUNCTION public.is_following(uuid) TO anon, authenticated;