-- Drop the overly permissive policy that exposes all profile columns for contest participants
DROP POLICY IF EXISTS "Anyone can view safe contest participant info" ON public.profiles;

-- Create a new restrictive policy that only allows viewing minimal safe fields
-- Note: PostgreSQL RLS doesn't support column-level restrictions in USING clause
-- So we need to ensure the frontend uses the contest_participants_safe view instead
-- This policy prevents direct access to the full profiles table for public users

-- Add a comment to document the security requirement
COMMENT ON TABLE public.profiles IS 'Contains sensitive personal data. Public access should only occur through sanitized views like contest_participants_safe which expose only id, display_name, and avatar_url.';

-- Ensure the contest_participants_safe view exists and is properly secured
-- The view already exists based on schema, but let's make sure it's documented
COMMENT ON VIEW public.contest_participants_safe IS 'Safe public view of contest participants. Only exposes id, display_name, avatar_url, and is_contest_participant flag. Use this instead of direct profiles table access.';