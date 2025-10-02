-- Add missing columns to weekly_contest_participants
ALTER TABLE weekly_contest_participants
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reviewed_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_contest_participants_submitted_at 
ON weekly_contest_participants(submitted_at DESC);

-- Add comment
COMMENT ON COLUMN weekly_contest_participants.submitted_at IS 'When the participant application was submitted';
COMMENT ON COLUMN weekly_contest_participants.reviewed_at IS 'When the application was reviewed by admin';
COMMENT ON COLUMN weekly_contest_participants.reviewed_by IS 'Admin user who reviewed the application';
COMMENT ON COLUMN weekly_contest_participants.notes IS 'Admin notes about the application';