-- Drop the existing check constraint
ALTER TABLE contest_applications DROP CONSTRAINT IF EXISTS contest_applications_status_check;

-- Add a new check constraint that includes 'next' as a valid status
ALTER TABLE contest_applications 
ADD CONSTRAINT contest_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'next'));