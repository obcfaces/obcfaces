-- Update participant statuses from week-specific format to standard format
UPDATE weekly_contest_participants 
SET admin_status = 'this week' 
WHERE admin_status = 'week-2025-09-23';