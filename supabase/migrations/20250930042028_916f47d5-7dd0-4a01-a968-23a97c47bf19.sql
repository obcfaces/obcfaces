-- Миграция для объединения всех статусов в один admin_status
-- Сохраняем историю изменений статусов

-- 1. Создаем функцию для сохранения истории изменений статусов
CREATE OR REPLACE FUNCTION public.save_status_migration_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Сохраняем изменение в status_history
  IF OLD.admin_status IS DISTINCT FROM NEW.admin_status THEN
    NEW.status_history := COALESCE(NEW.status_history, '[]'::jsonb) || 
      jsonb_build_object(
        'status', OLD.admin_status,
        'changed_at', now(),
        'changed_by', auth.uid(),
        'change_reason', 'Status migration - consolidated all status types'
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Создаем временный триггер для отслеживания изменений
CREATE TRIGGER save_status_migration_history_trigger
  BEFORE UPDATE ON weekly_contest_participants
  FOR EACH ROW
  EXECUTE FUNCTION save_status_migration_history();

-- 3. Мигрируем статусы из contest_applications в weekly_contest_participants
-- Для участников которые есть в weekly_contest_participants но их статус не соответствует статусу заявки
UPDATE weekly_contest_participants wcp
SET 
  admin_status = CASE 
    -- Если в заявке approved и участник в this week/next week - оставляем как есть
    WHEN ca.status = 'approved' AND wcp.admin_status IN ('this week', 'next week', 'next week on site', 'past') 
      THEN wcp.admin_status
    -- Если в заявке pending - ставим pending
    WHEN ca.status = 'pending' THEN 'pending'
    -- Если в заявке rejected - ставим rejected  
    WHEN ca.status = 'rejected' THEN 'rejected'
    -- Если в заявке under_review - ставим under review
    WHEN ca.status = 'under_review' THEN 'under review'
    -- Если approved но участник не в активных статусах - ставим approved
    WHEN ca.status = 'approved' THEN 'approved'
    -- По умолчанию оставляем текущий статус
    ELSE wcp.admin_status
  END,
  status_history = COALESCE(wcp.status_history, '[]'::jsonb) || 
    jsonb_build_object(
      'status', wcp.admin_status,
      'changed_at', now(),
      'changed_by', auth.uid(),
      'change_reason', CONCAT('Migrated from contest_applications.status: ', ca.status),
      'original_application_status', ca.status,
      'original_participant_status', wcp.participant_status::text
    )
FROM contest_applications ca
WHERE wcp.user_id = ca.user_id
  AND ca.is_active = true 
  AND ca.deleted_at IS NULL;

-- 4. Исправляем некорректные week-based статусы на past
UPDATE weekly_contest_participants
SET admin_status = 'past'
WHERE admin_status LIKE 'week-2025-%';

-- 5. Добавляем недостающие статусы которых не было в admin_status
-- Добавляем: rejected, under review, approved

-- 6. Удаляем временный триггер
DROP TRIGGER IF EXISTS save_status_migration_history_trigger ON weekly_contest_participants;
DROP FUNCTION IF EXISTS save_status_migration_history();

-- 7. Обновляем описание колонки admin_status
COMMENT ON COLUMN weekly_contest_participants.admin_status IS 'Unified status column - combines application status and participant status. Values: pending, under review, approved, rejected, this week, next week, next week on site, past';

-- 8. Создаем индекс для быстрого поиска по статусам
CREATE INDEX IF NOT EXISTS idx_weekly_contest_participants_admin_status 
ON weekly_contest_participants(admin_status) 
WHERE admin_status IS NOT NULL;