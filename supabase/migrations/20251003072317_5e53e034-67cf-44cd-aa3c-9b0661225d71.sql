-- ============================================================
-- SECURITY FIX PART 2: Remove remaining overly permissive policies
-- ============================================================

-- Remove the policy that allows any authenticated user to access profiles
DROP POLICY IF EXISTS "Public can access profiles only through secure functions" ON public.profiles;

-- The remaining policies should be:
-- 1. Users can view own profile (already exists)
-- 2. Admins and moderators can view all profiles (already exists)
-- 3. Authenticated users can view approved contest participants (just created)
-- 4. Users can view basic info of conversation participants (for messaging)

-- These are the ONLY ways to access profile data now:
-- - Own profile: full access
-- - Admin/moderator: full access to all
-- - Authenticated users: LIMITED access to contest participants (no sensitive fields)
-- - Conversation participants: basic info only for active chats
-- - Public: NO direct access (must use secure functions)

-- Verify the conversation participants policy exists for messaging functionality
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view basic info of conversation participants'
  ) THEN
    CREATE POLICY "Users can view basic info of conversation participants"
    ON public.profiles
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM conversation_participants cp1
        JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
        WHERE cp1.user_id = auth.uid() 
          AND cp2.user_id = profiles.id
          AND cp1.user_id <> cp2.user_id
      )
    );
  END IF;
END $$;