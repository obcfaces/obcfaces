-- Add is_contest_participant column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_contest_participant boolean DEFAULT false;

-- Drop the overly permissive policy that allowed viewing all approved profiles
DROP POLICY IF EXISTS "Contest participants basic info viewable" ON public.profiles;

-- Create a security definer function to get contest participant information
CREATE OR REPLACE FUNCTION public.get_contest_participant_info()
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  age integer,
  height_cm integer,
  city text,
  state text,
  country text
) 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.age,
    p.height_cm,
    p.city,
    p.state,
    p.country
  FROM public.profiles p
  WHERE p.is_contest_participant = true 
    AND p.is_approved = true;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_contest_participant_info() TO authenticated;

-- Create policy for contest participants to be viewable only if they explicitly opted in
CREATE POLICY "Contest participants basic info viewable" 
ON public.profiles 
FOR SELECT 
USING (
  (is_contest_participant = true) 
  AND (is_approved = true)
);