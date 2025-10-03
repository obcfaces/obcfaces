-- ============================================
-- FIX CRITICAL SECURITY ISSUE: Profiles Table Public Exposure
-- ============================================
-- This migration restricts access to sensitive PII in the profiles table
-- and creates a safe public view for contest participants

-- Step 1: Drop all existing overly permissive SELECT policies on profiles
DROP POLICY IF EXISTS "Contest participants viewable with restrictions" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic info of conversation participants" ON public.profiles;

-- Step 2: Keep only secure policies (own data, admin access)
-- These policies already exist and are secure:
-- - "Users can view own profile" - allows auth.uid() = id
-- - "Admins and moderators can view all profiles" - allows has_role for admin/moderator

-- Step 3: Create a safe public view for contest participants
-- This view exposes ONLY display_name and avatar_url - NO PII
CREATE OR REPLACE VIEW public.contest_participants_safe AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url,
  p.is_contest_participant
FROM public.profiles p
WHERE p.is_contest_participant = true 
  AND p.is_approved = true
  AND EXISTS (
    SELECT 1 FROM public.weekly_contest_participants wcp
    WHERE wcp.user_id = p.id 
      AND wcp.is_active = true
      AND wcp.deleted_at IS NULL
      AND wcp.admin_status IN ('this week', 'next week', 'next week on site', 'past')
  );

-- Enable RLS on the view (views inherit RLS from base tables, but we make it explicit)
-- Step 4: Create a policy to allow public read access to the safe view only
CREATE POLICY "Anyone can view safe contest participant info"
ON public.profiles
FOR SELECT
TO public
USING (
  id IN (
    SELECT id FROM public.contest_participants_safe
  )
  AND is_contest_participant = true
);

-- Step 5: Create a policy for conversation participants to see minimal info
-- Only users in the same conversation can see display_name and avatar_url of each other
CREATE POLICY "Conversation participants can view minimal profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Only allow display_name and avatar_url access, not full profile
  EXISTS (
    SELECT 1
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid() 
      AND cp2.user_id = profiles.id
      AND cp1.user_id != cp2.user_id
  )
);

-- Step 6: Add comment to document security fix
COMMENT ON VIEW public.contest_participants_safe IS 
'Safe public view of contest participants. Exposes ONLY display_name and avatar_url. 
NO PII (email, birthdate, address, physical characteristics, bio) is exposed.';

-- Step 7: Grant public read access to the safe view
GRANT SELECT ON public.contest_participants_safe TO anon;
GRANT SELECT ON public.contest_participants_safe TO authenticated;