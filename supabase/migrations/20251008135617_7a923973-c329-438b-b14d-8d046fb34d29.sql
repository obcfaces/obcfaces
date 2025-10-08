-- Allow applications without user_id for unauthenticated users
ALTER TABLE weekly_contest_participants 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add index for faster lookups of pending applications
CREATE INDEX IF NOT EXISTS idx_weekly_contest_participants_pending 
  ON weekly_contest_participants(id) 
  WHERE user_id IS NULL;
