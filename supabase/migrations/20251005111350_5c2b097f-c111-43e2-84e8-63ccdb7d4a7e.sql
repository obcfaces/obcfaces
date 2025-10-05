
-- Сначала удаляем materialized view который зависит от contestant_user_id
DROP MATERIALIZED VIEW IF EXISTS participant_stats CASCADE;

-- Удаляем старые уникальные ограничения с contestant_user_id
ALTER TABLE contestant_ratings 
DROP CONSTRAINT IF EXISTS contestant_ratings_user_id_contestant_name_contestant_user__key;

ALTER TABLE contestant_ratings 
DROP CONSTRAINT IF EXISTS unique_user_contestant_rating;

-- Удаляем колонку contestant_user_id
ALTER TABLE contestant_ratings 
DROP COLUMN IF EXISTS contestant_user_id;

-- Также удаляем из таблицы истории
ALTER TABLE contestant_rating_history
DROP COLUMN IF EXISTS contestant_user_id;

-- Проверяем оставшиеся ограничения
DO $$
DECLARE
  constraints_info TEXT;
BEGIN
  SELECT string_agg(conname || ': ' || pg_get_constraintdef(oid), E'\n')
  INTO constraints_info
  FROM pg_constraint
  WHERE conrelid = 'contestant_ratings'::regclass
    AND contype IN ('u', 'p');
  
  RAISE NOTICE 'Оставшиеся ограничения: %', COALESCE(constraints_info, 'Нет');
END $$;
