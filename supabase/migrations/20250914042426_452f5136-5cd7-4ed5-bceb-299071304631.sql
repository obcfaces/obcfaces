-- Fix critical security vulnerability in profiles table
-- Remove overly permissive RLS policies that expose sensitive personal data

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable with proper access" ON public.profiles;

-- Create secure, restrictive policies
-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Contest participants with explicit public privacy can be viewed by authenticated users
CREATE POLICY "Contest participants profiles are viewable" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND is_contest_participant = true 
  AND is_approved = true
  AND privacy_level = 'public'
);

-- 3. Admins and moderators can view all profiles
CREATE POLICY "Admins and moderators can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- 4. Users can view conversation participants profiles (for messaging functionality)
CREATE POLICY "Users can view conversation participants profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid() 
    AND cp2.user_id = profiles.id 
    AND cp1.user_id != cp2.user_id
  )
);

-- Set default privacy level to 'private' for new profiles to ensure privacy by default
ALTER TABLE public.profiles ALTER COLUMN privacy_level SET DEFAULT 'private';

-- Update existing profiles with NULL privacy_level to 'private' (except contest participants)
UPDATE public.profiles 
SET privacy_level = 'private' 
WHERE privacy_level IS NULL 
AND (is_contest_participant IS NOT TRUE OR is_approved IS NOT TRUE);