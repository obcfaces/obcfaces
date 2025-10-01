-- Fix incorrect admin_status 'week-2025-09-23' for past week participants
-- These should have 'past' status, not week-specific status

UPDATE weekly_contest_participants
SET admin_status = 'past'
WHERE admin_status = 'week-2025-09-23'
  AND is_active = true;

-- Add comment to log this fix
COMMENT ON TABLE weekly_contest_participants IS 'Fixed admin_status from week-2025-09-23 to past for old participants';