-- First, delete orphaned records that reference non-existent participants
DELETE FROM contest_application_history
WHERE application_id NOT IN (SELECT id FROM weekly_contest_participants);

-- Drop the old constraint
ALTER TABLE contest_application_history 
DROP CONSTRAINT IF EXISTS contest_application_history_application_id_fkey;

-- Add correct foreign key to weekly_contest_participants
ALTER TABLE contest_application_history
ADD CONSTRAINT contest_application_history_application_id_fkey 
FOREIGN KEY (application_id) 
REFERENCES weekly_contest_participants(id) 
ON DELETE CASCADE;

-- Create trigger to save application history when weekly_contest_participants is updated
DROP TRIGGER IF EXISTS save_application_history_trigger ON weekly_contest_participants;

CREATE TRIGGER save_application_history_trigger
  BEFORE UPDATE ON weekly_contest_participants
  FOR EACH ROW
  EXECUTE FUNCTION save_application_history();

-- Insert test history records for the test participant to demonstrate the version badge
INSERT INTO contest_application_history (
  application_id,
  application_data,
  status,
  notes,
  change_reason,
  created_at
) 
SELECT 
  id,
  application_data,
  'updated',
  'Version 1 - Initial submission',
  'Test history entry for version badge demonstration',
  created_at - INTERVAL '2 hours'
FROM weekly_contest_participants
WHERE id = 'f945718f-d4a8-4c1f-8bb2-c2969f1a2463';

-- Insert second version
INSERT INTO contest_application_history (
  application_id,
  application_data,
  status,
  notes,
  change_reason,
  created_at
) 
SELECT 
  id,
  application_data,
  'updated',
  'Version 2 - After edits',
  'Test history entry - second version',
  created_at - INTERVAL '1 hour'
FROM weekly_contest_participants
WHERE id = 'f945718f-d4a8-4c1f-8bb2-c2969f1a2463';