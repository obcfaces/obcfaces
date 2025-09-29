-- Исправляем статус участников с "week-2025-09-15" на "this week"
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'week-2025-09-15' AND is_active = true;