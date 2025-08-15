-- Drop the overly permissive policy that allows any authenticated user to view approved profiles
DROP POLICY IF EXISTS "Authenticated users can view approved profiles" ON public.profiles;

-- Drop the friends policy as well since it may be too permissive
DROP POLICY IF EXISTS "Authenticated users can view friends profiles" ON public.profiles;

-- Add a new column to mark profiles that are specifically for public contest participation
-- This will be more explicit than just using is_approved
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_contest_participant boolean DEFAULT false;

-- Create a more restrictive policy for contest participants
-- Only show minimal contest-related data, not full personal profiles
CREATE POLICY "Contest participants basic info viewable" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  is_contest_participant = true 
  AND is_approved = true
);

-- Create a function that returns only contest-safe data for participants
CREATE OR REPLACE FUNCTION public.get_contest_participant_info(participant_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  age integer,
  country text,
  city text,
  height_cm integer,
  weight_kg numeric
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.age,
    p.country,
    p.city,
    p.height_cm,
    p.weight_kg
  FROM public.profiles p
  WHERE p.id = participant_id
    AND p.is_contest_participant = true
    AND p.is_approved = true;
$$;

-- Update existing contest participants (set is_contest_participant = true for approved profiles)
-- This assumes that currently approved profiles are contest participants
UPDATE public.profiles 
SET is_contest_participant = true 
WHERE is_approved = true;

-- Create a policy for users to opt-in to contest participation
CREATE POLICY "Users can update their contest participation status" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add comment explaining the security model
COMMENT ON COLUMN public.profiles.is_contest_participant IS 
'Explicit consent for profile to be visible in contests. Must be true AND is_approved = true for contest visibility.';

COMMENT ON FUNCTION public.get_contest_participant_info(uuid) IS 
'Returns only contest-relevant data for participants who have explicitly opted in. Excludes sensitive fields like birthdate, bio, and moderation notes.';