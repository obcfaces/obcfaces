-- Remove 'under_review' and 'approved' from participant_admin_status enum

-- First, update any existing records with these statuses to 'rejected'
UPDATE weekly_contest_participants 
SET admin_status = 'rejected'
WHERE admin_status IN ('under_review', 'approved');

-- Drop the default constraint temporarily
ALTER TABLE weekly_contest_participants 
  ALTER COLUMN admin_status DROP DEFAULT;

-- Create new enum without the removed values
CREATE TYPE participant_admin_status_new AS ENUM (
  'pending',
  'rejected', 
  'this week',
  'next week',
  'next week on site',
  'past',
  'pre next week'
);

-- Update the table to use the new enum
ALTER TABLE weekly_contest_participants 
  ALTER COLUMN admin_status TYPE participant_admin_status_new 
  USING admin_status::text::participant_admin_status_new;

-- Drop the old enum and rename the new one
DROP TYPE participant_admin_status;
ALTER TYPE participant_admin_status_new RENAME TO participant_admin_status;

-- Restore the default value
ALTER TABLE weekly_contest_participants 
  ALTER COLUMN admin_status SET DEFAULT 'pending'::participant_admin_status;