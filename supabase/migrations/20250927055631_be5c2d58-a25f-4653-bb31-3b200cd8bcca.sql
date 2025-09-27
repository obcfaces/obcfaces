-- SECURITY FIX: Remove overly permissive public access to contestant_ratings
-- and replace with secure aggregate functions

-- 1. DROP the dangerous public policy
DROP POLICY IF EXISTS "Public can view rating statistics" ON public.contestant_ratings;

-- 2. Create secure functions for public aggregate statistics
CREATE OR REPLACE FUNCTION public.get_public_rating_stats(target_contestant_name text)
RETURNS TABLE(average_rating numeric, total_votes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Return only aggregate stats, no personal identifiers
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*) as total_votes
  FROM contestant_ratings 
  WHERE contestant_name = target_contestant_name;
$$;

CREATE OR REPLACE FUNCTION public.get_public_participant_rating_stats(target_participant_id uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Return only aggregate stats, no personal identifiers
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*) as total_votes
  FROM contestant_ratings 
  WHERE participant_id = target_participant_id;
$$;

-- 3. Create function to check if current user has voted (for UI state)
CREATE OR REPLACE FUNCTION public.check_user_has_voted_for_participant(target_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM contestant_ratings 
    WHERE participant_id = target_participant_id 
      AND user_id = auth.uid()
  );
$$;

-- 4. Add policy for contest participants to view aggregate rating data
-- (Only authenticated users who are contest participants)
CREATE POLICY "Contest participants can view aggregate ratings"
ON public.contestant_ratings
FOR SELECT
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND is_contest_participant = true 
      AND is_approved = true
  )
);

-- Grant execute permissions on the new secure functions
GRANT EXECUTE ON FUNCTION public.get_public_rating_stats(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_participant_rating_stats(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_has_voted_for_participant(uuid) TO authenticated;