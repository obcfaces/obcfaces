-- Update all 'pre next week' participants to correct current week interval
UPDATE weekly_contest_participants
SET week_interval = '29/09-05/10/25'
WHERE admin_status = 'pre next week'
  AND week_interval = '22/09-28/09/25';