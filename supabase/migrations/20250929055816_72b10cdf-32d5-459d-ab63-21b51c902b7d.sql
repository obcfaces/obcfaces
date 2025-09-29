-- Удаляем запись "this week" из истории статусов для Charmel Cabiles
UPDATE weekly_contest_participants 
SET 
  status_history = status_history - 'this week'
WHERE id = 'abedd7b7-fa9e-4081-996e-893f3a9d7e90';