-- ============================================================================
-- FIX: Security Definer View - Convert views to SECURITY INVOKER
-- ============================================================================
-- Issue: Views with SECURITY DEFINER enforce permissions of view creator
-- instead of the querying user, which can bypass RLS policies
-- 
-- Solution: Recreate views with security_invoker=true
-- ============================================================================

-- Drop and recreate contest_applications_backup view with SECURITY INVOKER
DROP VIEW IF EXISTS public.contest_applications_backup CASCADE;

CREATE VIEW public.contest_applications_backup 
WITH (security_invoker=true)
AS
SELECT 
  id,
  user_id,
  application_data,
  submitted_at,
  reviewed_at,
  reviewed_by,
  notes,
  created_at,
  updated_at,
  last_participation_date,
  is_active,
  deleted_at,
  status
FROM public._archived_contest_applications;

-- Add comment explaining the view purpose and security mode
COMMENT ON VIEW public.contest_applications_backup IS 
  'Backup view of archived contest applications. Uses SECURITY INVOKER to enforce RLS policies of the querying user.';

-- Drop and recreate contest_participants_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.contest_participants_public CASCADE;

CREATE VIEW public.contest_participants_public 
WITH (security_invoker=true)
AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url,
  p.is_contest_participant
FROM public.profiles p
WHERE p.is_contest_participant = true
  AND p.is_approved = true
  AND public.is_active_contest_participant(p.id);

-- Add comment explaining the view purpose and security mode
COMMENT ON VIEW public.contest_participants_public IS 
  'Public view of active contest participants. Uses SECURITY INVOKER to enforce RLS policies of the querying user.';

-- Add RLS policies to the underlying _archived_contest_applications table if not exists
ALTER TABLE public._archived_contest_applications ENABLE ROW LEVEL SECURITY;

-- Only admins and moderators can view archived applications
DROP POLICY IF EXISTS "Admins can view archived applications" ON public._archived_contest_applications;
CREATE POLICY "Admins can view archived applications"
  ON public._archived_contest_applications
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- Users can view their own archived applications
DROP POLICY IF EXISTS "Users can view own archived applications" ON public._archived_contest_applications;
CREATE POLICY "Users can view own archived applications"
  ON public._archived_contest_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);