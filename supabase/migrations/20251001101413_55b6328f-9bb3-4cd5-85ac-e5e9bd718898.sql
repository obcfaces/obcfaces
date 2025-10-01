-- Add status column to contest_applications table
ALTER TABLE contest_applications 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Add check constraint for valid statuses
ALTER TABLE contest_applications
ADD CONSTRAINT contest_applications_status_check 
CHECK (status IN ('pending', 'under_review', 'approved', 'rejected'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contest_applications_status 
ON contest_applications(status) 
WHERE deleted_at IS NULL;