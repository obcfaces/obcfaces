-- Update all 'this week' participants to have the current week interval
UPDATE weekly_contest_participants
SET week_interval = '06/10-12/10/25'
WHERE admin_status = 'this week'
  AND is_active = true
  AND deleted_at IS NULL
  AND week_interval != '06/10-12/10/25';
