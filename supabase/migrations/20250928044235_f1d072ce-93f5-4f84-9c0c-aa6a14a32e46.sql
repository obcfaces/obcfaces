-- Добавляем поле status_history
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weekly_contest_participants' 
                   AND column_name = 'status_history') THEN
        ALTER TABLE public.weekly_contest_participants 
        ADD COLUMN status_history JSONB DEFAULT '{}';
        
        -- Инициализируем историю для существующих записей
        UPDATE public.weekly_contest_participants wcp
        SET status_history = jsonb_build_object(
          wcp.admin_status, 
          jsonb_build_object(
            'week_start_date', wc.week_start_date,
            'week_end_date', wc.week_end_date,
            'contest_title', wc.title,
            'changed_at', wcp.created_at
          )
        )
        FROM weekly_contests wc
        WHERE wcp.contest_id = wc.id;
    END IF;
END $$;

-- Добавляем функцию для обновления истории статусов
CREATE OR REPLACE FUNCTION public.update_participant_status_history()
RETURNS TRIGGER AS $$
DECLARE
  week_info JSONB;
BEGIN
  -- Получаем информацию о неделе конкурса
  SELECT jsonb_build_object(
    'week_start_date', wc.week_start_date,
    'week_end_date', wc.week_end_date,
    'contest_title', wc.title,
    'changed_at', now()
  ) INTO week_info
  FROM weekly_contests wc 
  WHERE wc.id = NEW.contest_id;

  -- Обновляем историю статусов
  NEW.status_history = COALESCE(NEW.status_history, '{}'::jsonb) || 
    jsonb_build_object(NEW.admin_status, week_info);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Создаем триггер для автоматического обновления истории статусов
DROP TRIGGER IF EXISTS trigger_update_status_history ON public.weekly_contest_participants;
CREATE TRIGGER trigger_update_status_history
  BEFORE UPDATE OF admin_status ON public.weekly_contest_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_participant_status_history();

-- Создаем триггер для инициализации истории при создании записи
DROP TRIGGER IF EXISTS trigger_init_status_history ON public.weekly_contest_participants;
CREATE TRIGGER trigger_init_status_history
  BEFORE INSERT ON public.weekly_contest_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_participant_status_history();