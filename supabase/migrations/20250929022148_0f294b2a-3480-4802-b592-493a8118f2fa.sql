-- Исправляем статусы участников для правильного отображения
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'week-2025-09-15' AND is_active = true;