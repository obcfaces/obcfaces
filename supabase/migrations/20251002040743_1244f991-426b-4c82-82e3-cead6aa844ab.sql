-- Add deleted_at column to weekly_contest_participants for soft deletes
ALTER TABLE weekly_contest_participants
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for better query performance on deleted_at
CREATE INDEX IF NOT EXISTS idx_weekly_contest_participants_deleted_at 
ON weekly_contest_participants(deleted_at) WHERE deleted_at IS NOT NULL;