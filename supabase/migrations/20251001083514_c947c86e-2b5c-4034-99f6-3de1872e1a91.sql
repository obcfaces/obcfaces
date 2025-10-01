-- Drop all triggers that depend on admin_status column
DROP TRIGGER IF EXISTS auto_assign_participant_status_trigger ON weekly_contest_participants;
DROP TRIGGER IF EXISTS trigger_update_status_history ON weekly_contest_participants;

-- Drop the functions if they exist
DROP FUNCTION IF EXISTS auto_assign_participant_status() CASCADE;
DROP FUNCTION IF EXISTS update_status_history() CASCADE;

-- Remove the default value
ALTER TABLE weekly_contest_participants 
  ALTER COLUMN admin_status DROP DEFAULT;

-- Drop existing enum if exists and create new one with all statuses
DROP TYPE IF EXISTS participant_admin_status CASCADE;

CREATE TYPE participant_admin_status AS ENUM (
  'pending',
  'under_review', 
  'approved',
  'rejected',
  'this week',
  'next week',
  'next week on site',
  'past'
);

-- Update NULL values first
UPDATE weekly_contest_participants 
SET admin_status = 'pending'
WHERE admin_status IS NULL;

-- Now change the column type
ALTER TABLE weekly_contest_participants 
  ALTER COLUMN admin_status TYPE participant_admin_status 
  USING admin_status::participant_admin_status;

-- Set new default value
ALTER TABLE weekly_contest_participants 
  ALTER COLUMN admin_status SET DEFAULT 'pending'::participant_admin_status;

-- Make column NOT NULL
ALTER TABLE weekly_contest_participants 
  ALTER COLUMN admin_status SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_contest_participants_admin_status 
ON weekly_contest_participants(admin_status);

-- Recreate the status history trigger function with new enum
CREATE OR REPLACE FUNCTION update_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.admin_status IS DISTINCT FROM NEW.admin_status THEN
    NEW.status_history = COALESCE(NEW.status_history, '{}'::jsonb) || 
      jsonb_build_object(
        to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        jsonb_build_object(
          'old_status', OLD.admin_status::text,
          'new_status', NEW.admin_status::text,
          'changed_by', auth.uid()
        )
      );
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_update_status_history
  BEFORE UPDATE ON weekly_contest_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_status_history();