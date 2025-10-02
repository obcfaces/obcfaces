-- Security Fix: Remove overly permissive RLS policy on weekly_contest_participants
-- This table contains sensitive personal information that should not be publicly readable
-- Public access should only go through the secure RPC function get_weekly_contest_participants_public

-- Drop the overly permissive policy that allows anyone to read all columns
DROP POLICY IF EXISTS "Anyone can view contest participants for display" ON public.weekly_contest_participants;

-- Ensure we have proper admin-only policies
-- This policy already exists, but we're recreating it to be explicit
DROP POLICY IF EXISTS "Admins can view all weekly contest participants" ON public.weekly_contest_participants;

CREATE POLICY "Admins can view all weekly contest participants"
ON public.weekly_contest_participants
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Ensure users can only view their own participation records
CREATE POLICY "Users can view their own participation records"
ON public.weekly_contest_participants
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add comment explaining the security model
COMMENT ON TABLE public.weekly_contest_participants IS 
'Contains sensitive personal information. Public access MUST go through get_weekly_contest_participants_public() RPC which returns only safe display fields. Direct table access is restricted to admins, moderators, and the user themselves.';

-- Verify the secure RPC functions exist and grant proper permissions
GRANT EXECUTE ON FUNCTION public.get_weekly_contest_participants_public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_contest_participants_admin TO authenticated;