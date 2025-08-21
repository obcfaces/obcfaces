-- Add last_contest_participation_date to contest_applications table
ALTER TABLE contest_applications 
ADD COLUMN last_participation_date TIMESTAMP WITH TIME ZONE;

-- Add index for performance
CREATE INDEX idx_contest_applications_last_participation 
ON contest_applications(user_id, last_participation_date);

-- Update existing records to set last_participation_date from submitted_at
UPDATE contest_applications 
SET last_participation_date = submitted_at 
WHERE submitted_at IS NOT NULL;