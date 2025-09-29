-- Обновляем статус Mia Morgan: удаляем "past" из истории и меняем admin_status на "pending"
UPDATE weekly_contest_participants 
SET 
  admin_status = 'pending',
  status_week_history = status_week_history - 'past',
  status_history = status_history - 'past'
WHERE id = '163293b3-3f10-49a5-bbd6-a9bc2568f10d';

-- Обновляем статус test21-09-03 test: удаляем "past" из истории и меняем admin_status на "pending" 
UPDATE weekly_contest_participants 
SET 
  admin_status = 'pending',
  status_week_history = status_week_history - 'past',
  status_history = status_history - 'past'
WHERE id = 'bda81832-ca83-49ac-8ddf-f282b7230916';