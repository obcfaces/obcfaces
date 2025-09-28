-- Еженедельный переход для новой недели 29 сентября - 5 октября 2025

-- 1. Закрыть предыдущие активные конкурсы
UPDATE weekly_contests 
SET status = 'closed', updated_at = NOW()
WHERE status = 'active';

-- 2. Создать новый конкурс для текущей недели (29 сентября - 5 октября)
INSERT INTO weekly_contests (week_start_date, week_end_date, title, status)
VALUES ('2025-09-29', '2025-10-05', 'Contest 29 Sep-05 Oct 2025', 'active');

-- 3. Определить победителя предыдущей недели (22-28 сентября) и обновить ранги
WITH previous_week_participants AS (
  SELECT 
    wcp.id,
    wcp.user_id,
    wcp.average_rating,
    wcp.total_votes,
    ROW_NUMBER() OVER (ORDER BY wcp.average_rating DESC, wcp.total_votes DESC) as new_rank
  FROM weekly_contest_participants wcp
  JOIN weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = '2025-09-22'
    AND wcp.admin_status = 'this week'
    AND wcp.is_active = true
)
UPDATE weekly_contest_participants wcp
SET final_rank = pwp.new_rank
FROM previous_week_participants pwp
WHERE wcp.id = pwp.id;

-- 4. Переместить участников по статусам для нового цикла
-- Сначала past week 2 -> past week 3 (удаляем старых)
UPDATE weekly_contest_participants 
SET admin_status = 'past week 3'
WHERE admin_status = 'past week 2';

-- past week 1 -> past week 2
UPDATE weekly_contest_participants 
SET admin_status = 'past week 2'
WHERE admin_status = 'past week 1';

-- this week -> past week 1
UPDATE weekly_contest_participants 
SET admin_status = 'past week 1'
WHERE admin_status = 'this week';

-- next week on site -> this week  
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'next week on site';

-- next week -> next week on site
UPDATE weekly_contest_participants 
SET admin_status = 'next week on site'
WHERE admin_status = 'next week';

-- 5. Проверить результаты
SELECT 
  'Участники this week' as category,
  COUNT(*) as count
FROM weekly_contest_participants 
WHERE admin_status = 'this week' AND is_active = true
UNION ALL
SELECT 
  'Активный конкурс' as category,
  COUNT(*) as count
FROM weekly_contests 
WHERE status = 'active' AND week_start_date = '2025-09-29';