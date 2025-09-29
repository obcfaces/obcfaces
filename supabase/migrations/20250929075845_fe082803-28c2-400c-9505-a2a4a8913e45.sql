-- Сначала обновляем статусы участников без удаления дубликатов
UPDATE weekly_contest_participants 
SET 
  admin_status = 'this week',
  week_interval = '29/09-05/10/25'
WHERE user_id IN (
  '0a271999-b510-490e-abe6-7d30d7bcd11a', -- Mildred
  '87b94590-ab6b-46e2-8d11-83e2f882e602'  -- Kate
) AND is_active = true;

-- Обновляем все записи рейтингов, чтобы они ссылались на правильные записи участников
-- Находим правильные participant_id для каждого пользователя (берем последнюю запись)
WITH correct_participants AS (
  SELECT DISTINCT ON (user_id) 
    id as correct_participant_id,
    user_id
  FROM weekly_contest_participants 
  WHERE is_active = true
  ORDER BY user_id, created_at DESC
)
UPDATE contestant_ratings cr
SET participant_id = cp.correct_participant_id
FROM correct_participants cp
WHERE cr.contestant_user_id = cp.user_id;