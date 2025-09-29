-- Обновить статус участников с "next week on site" на "this week" для недели 22/09-28/09/25
-- и перенести их в текущую неделю

DO $$
DECLARE
    target_week_start DATE := '2024-09-23';  -- понедельник недели 22/09-28/09
    current_week_start DATE := get_week_monday(CURRENT_DATE);
    current_contest_id UUID;
    participant_record RECORD;
    new_history JSONB;
BEGIN
    -- Получить ID текущего конкурса
    SELECT id INTO current_contest_id 
    FROM weekly_contests 
    WHERE week_start_date = current_week_start 
      AND status = 'active';
    
    -- Если текущий конкурс не найден, создать его
    IF current_contest_id IS NULL THEN
        current_contest_id := create_weekly_contest(current_week_start);
    END IF;
    
    -- Найти и обновить участников
    FOR participant_record IN
        SELECT 
            wcp.id,
            wcp.user_id,
            wcp.application_data,
            wcp.status_week_history,
            wcp.average_rating,
            wcp.total_votes
        FROM weekly_contest_participants wcp
        JOIN weekly_contests wc ON wcp.contest_id = wc.id
        WHERE wc.week_start_date = target_week_start
          AND wcp.admin_status = 'next week on site'
          AND wcp.is_active = true
    LOOP
        -- Создать запись в текущей неделе с обновленной историей
        new_history := COALESCE(participant_record.status_week_history, '{}'::jsonb) || 
                      jsonb_build_object(
                          current_week_start::text, 
                          jsonb_build_object(
                              'status', 'this week',
                              'transitioned_from', 'next week on site',
                              'transition_date', NOW()
                          )
                      );
        
        -- Проверить, есть ли уже запись для этого пользователя в текущей неделе
        IF NOT EXISTS (
            SELECT 1 FROM weekly_contest_participants 
            WHERE contest_id = current_contest_id 
              AND user_id = participant_record.user_id
        ) THEN
            -- Создать новую запись в текущей неделе
            INSERT INTO weekly_contest_participants (
                contest_id,
                user_id,
                application_data,
                admin_status,
                status_week_history,
                average_rating,
                total_votes,
                is_active,
                week_interval
            ) VALUES (
                current_contest_id,
                participant_record.user_id,
                participant_record.application_data,
                'this week',
                new_history,
                participant_record.average_rating,
                participant_record.total_votes,
                true,
                CONCAT(current_week_start::text, ' - ', (current_week_start + INTERVAL '6 days')::text)
            );
            
            RAISE NOTICE 'Transitioned participant % to "this week" status', 
                participant_record.application_data->>'first_name' || ' ' || participant_record.application_data->>'last_name';
        ELSE
            -- Обновить существующую запись
            UPDATE weekly_contest_participants 
            SET 
                admin_status = 'this week',
                status_week_history = new_history,
                week_interval = CONCAT(current_week_start::text, ' - ', (current_week_start + INTERVAL '6 days')::text)
            WHERE contest_id = current_contest_id 
              AND user_id = participant_record.user_id;
              
            RAISE NOTICE 'Updated existing participant % to "this week" status', 
                participant_record.application_data->>'first_name' || ' ' || participant_record.application_data->>'last_name';
        END IF;
        
        -- Деактивировать старую запись
        UPDATE weekly_contest_participants 
        SET is_active = false
        WHERE id = participant_record.id;
    END LOOP;
    
    RAISE NOTICE 'Successfully transitioned participants from "next week on site" to "this week"';
END $$;