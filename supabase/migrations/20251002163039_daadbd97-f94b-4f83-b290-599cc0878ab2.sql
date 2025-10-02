-- Безопасное удаление дубликатов из weekly_contest_participants
-- Защищаем карточки, отображаемые на публичном сайте

DO $$
DECLARE
  duplicate_record RECORD;
  keep_record_id UUID;
  history_length INTEGER;
BEGIN
  -- Находим всех пользователей с дубликатами (более одной записи)
  FOR duplicate_record IN
    SELECT 
      user_id,
      COUNT(*) as duplicate_count
    FROM weekly_contest_participants
    WHERE deleted_at IS NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Processing user_id: % (% duplicates)', duplicate_record.user_id, duplicate_record.duplicate_count;
    
    -- Проверяем, есть ли у этого user_id записи с защищенными статусами (используемые на сайте)
    SELECT id INTO keep_record_id
    FROM weekly_contest_participants
    WHERE user_id = duplicate_record.user_id
      AND deleted_at IS NULL
      AND admin_status IN ('this week'::participant_admin_status, 'past'::participant_admin_status)
    ORDER BY 
      CASE 
        WHEN admin_status = 'this week'::participant_admin_status THEN 1
        WHEN admin_status = 'past'::participant_admin_status THEN 2
        ELSE 3
      END,
      created_at DESC
    LIMIT 1;
    
    -- Если нашли защищенную запись, используем её
    IF keep_record_id IS NOT NULL THEN
      RAISE NOTICE 'Keeping protected record: % (displayed on public site)', keep_record_id;
    ELSE
      -- Если нет защищенных, выбираем запись с наибольшим количеством изменений статуса
      SELECT id INTO keep_record_id
      FROM weekly_contest_participants
      WHERE user_id = duplicate_record.user_id
        AND deleted_at IS NULL
      ORDER BY 
        -- Сортируем по количеству записей в status_history (безопасно)
        CASE 
          WHEN jsonb_typeof(status_history) = 'array' 
          THEN jsonb_array_length(status_history)
          ELSE 0
        END DESC,
        -- Затем по дате создания (новее = лучше)
        created_at DESC
      LIMIT 1;
      
      RAISE NOTICE 'Keeping record with most status changes: %', keep_record_id;
    END IF;
    
    -- Мягко удаляем все остальные записи для этого user_id
    UPDATE weekly_contest_participants
    SET deleted_at = NOW()
    WHERE user_id = duplicate_record.user_id
      AND id != keep_record_id
      AND deleted_at IS NULL;
      
    RAISE NOTICE 'Soft-deleted % duplicate records for user_id: %', 
      (duplicate_record.duplicate_count - 1), 
      duplicate_record.user_id;
  END LOOP;
  
  RAISE NOTICE 'Deduplication complete';
END $$;