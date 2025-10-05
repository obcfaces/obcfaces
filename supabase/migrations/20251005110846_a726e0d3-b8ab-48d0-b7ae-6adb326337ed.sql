
-- Шаг 1: Заполняем participant_id там где его нет
-- Находим записи contestant_ratings где есть contestant_user_id, но нет participant_id
UPDATE contestant_ratings cr
SET participant_id = wcp.id
FROM weekly_contest_participants wcp
WHERE cr.contestant_user_id = wcp.user_id
  AND cr.participant_id IS NULL
  AND wcp.is_active = true
  AND wcp.deleted_at IS NULL;

-- Проверяем результат
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM contestant_ratings
  WHERE participant_id IS NULL;
  
  RAISE NOTICE 'Записей без participant_id после миграции: %', updated_count;
END $$;
