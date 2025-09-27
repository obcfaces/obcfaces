-- Создадим правильные статусы для прошлых недель
-- Сначала создадим участниц для недели 15.09-21.09 (past week 1)

-- Переназначим некоторых участниц из past week 2 в past week 1
-- Выберем половину участниц с датами создания 13-14 сентября

UPDATE weekly_contest_participants 
SET admin_status = 'past week 1'
WHERE id IN (
  SELECT id 
  FROM weekly_contest_participants 
  WHERE admin_status = 'past week 2' 
    AND created_at::date >= '2025-09-13'
  LIMIT 3
);

-- Также проверим текущие статусы
SELECT 
  admin_status,
  COUNT(*) as count
FROM weekly_contest_participants 
GROUP BY admin_status
ORDER BY admin_status;