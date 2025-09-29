-- Восстанавливаем правильные недельные статусы после перехода
-- Сначала архивируем старые записи в "past"
UPDATE weekly_contest_participants 
SET admin_status = 'past'
WHERE admin_status = 'past week 2' AND is_active = true;

-- Сдвигаем "past week 1" в "past week 2"  
UPDATE weekly_contest_participants 
SET admin_status = 'past week 2'
WHERE admin_status = 'past week 1' AND is_active = true;

-- Сдвигаем "this week" в "past week 1"
UPDATE weekly_contest_participants 
SET admin_status = 'past week 1'
WHERE admin_status = 'this week' AND is_active = true;

-- Теперь нужно найти участников со статусом "next week on site" и переместить их в "this week"
-- Также проверим есть ли участники со статусом "next week" для перемещения в "next week on site"