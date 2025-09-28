-- Remove check constraint temporarily to allow migration
ALTER TABLE public.contest_applications 
DROP CONSTRAINT IF EXISTS contest_applications_status_check;

-- Update contest applications with status 'next' to 'next week'
UPDATE public.contest_applications 
SET status = 'next week' 
WHERE status = 'next';

-- Update weekly contest participants with admin_status 'next' to 'next week'  
UPDATE public.weekly_contest_participants 
SET admin_status = 'next week' 
WHERE admin_status = 'next';

-- Re-add check constraint with updated valid values
ALTER TABLE public.contest_applications 
ADD CONSTRAINT contest_applications_status_check 
CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'next week'));