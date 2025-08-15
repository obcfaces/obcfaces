-- Further restrict the RLS policy to prevent direct access to sensitive personal data
-- The current policy allows SELECT on all columns for contest participants
-- We need to remove this policy entirely since the secure function should be the only access method

-- Drop the overly permissive RLS policy that exposes sensitive personal data
DROP POLICY IF EXISTS "Contest participants basic info viewable" ON public.profiles;

-- Note: Contest participant data should only be accessed through the secure 
-- get_contest_participant_info() function which returns only safe fields
-- (id, display_name, avatar_url). Direct table access is removed for security.