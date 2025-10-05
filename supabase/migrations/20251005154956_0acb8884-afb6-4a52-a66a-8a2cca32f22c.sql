-- Update all 'this week' participants to current week interval
UPDATE weekly_contest_participants
SET week_interval = '29/09-05/10/25'
WHERE admin_status = 'this week'
  AND is_active = true
  AND deleted_at IS NULL;