-- Archive old contest_applications table
-- All data has been migrated to weekly_contest_participants

-- Step 1: Rename the old table to _archived_contest_applications
ALTER TABLE public.contest_applications 
RENAME TO _archived_contest_applications;

-- Step 2: Add comment to archived table
COMMENT ON TABLE public._archived_contest_applications IS 
'Archived table - data migrated to weekly_contest_participants on 2025-10-03. 
This table is kept for historical reference only.';

-- Step 3: Remove RLS policies from archived table (not needed anymore)
DROP POLICY IF EXISTS "Admins and moderators can view all applications" ON public._archived_contest_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public._archived_contest_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public._archived_contest_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public._archived_contest_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public._archived_contest_applications;

-- Step 4: Update the backup view to point to archived table
DROP VIEW IF EXISTS public.contest_applications_backup;
CREATE OR REPLACE VIEW public.contest_applications_backup AS
SELECT * FROM public._archived_contest_applications;

COMMENT ON VIEW public.contest_applications_backup IS 
'Read-only view of archived contest_applications data for reference';

-- Step 5: Update contest_application_history foreign key to point to archived table
ALTER TABLE public.contest_application_history
DROP CONSTRAINT IF EXISTS contest_application_history_application_id_fkey;

ALTER TABLE public.contest_application_history
ADD CONSTRAINT contest_application_history_application_id_fkey 
FOREIGN KEY (application_id) 
REFERENCES public._archived_contest_applications(id) 
ON DELETE CASCADE;

-- Step 6: Log completion
DO $$
BEGIN
  RAISE NOTICE 'contest_applications table archived successfully. All active operations now use weekly_contest_participants.';
END $$;