-- Fix security issue: Restrict contest participant data exposure to non-sensitive fields only
-- Remove sensitive personal information (age, height, weight, location) from public access

-- Drop existing functions first to avoid type conflicts
DROP FUNCTION IF EXISTS public.get_contest_participant_info();
DROP FUNCTION IF EXISTS public.get_contest_participant_info(uuid);

-- Create new secure function that only returns safe, non-sensitive information
CREATE OR REPLACE FUNCTION public.get_contest_participant_info()
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text
) 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.is_contest_participant = true 
    AND p.is_approved = true;
$$;

-- Create overloaded version that takes a participant_id parameter
CREATE OR REPLACE FUNCTION public.get_contest_participant_info(participant_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text
) 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = participant_id
    AND p.is_contest_participant = true 
    AND p.is_approved = true;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_contest_participant_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contest_participant_info(uuid) TO authenticated;