-- List and remove all policies on conversation_participants table
-- First disable RLS temporarily to avoid conflicts
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies explicitly
DROP POLICY IF EXISTS "Users can view their own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can create their own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "View conversation participants when authorized" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of their conversations new" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they're in new" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation records" ON public.conversation_participants;

-- Re-enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible policies to avoid recursion
CREATE POLICY "simple_user_participation_view"
ON public.conversation_participants
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "simple_user_participation_insert"
ON public.conversation_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());