
-- Update all participants with admin_status 'this week' to have the same week_interval and ensure they are active
UPDATE weekly_contest_participants
SET 
  week_interval = '22/09-28/09/25',
  is_active = true
WHERE admin_status = 'this week';
