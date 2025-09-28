-- Добавляем поле week_interval для отображения интервала недели
ALTER TABLE public.weekly_contest_participants 
ADD COLUMN IF NOT EXISTS week_interval TEXT;

-- Удаляем и пересоздаем функцию с новым возвращаемым типом
DROP FUNCTION IF EXISTS public.get_next_week_participants_public();

CREATE OR REPLACE FUNCTION public.get_next_week_participants_public()
RETURNS TABLE(
  participant_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  age integer,
  city text,
  country text,
  photo_1_url text,
  photo_2_url text,
  height_cm integer,
  weight_kg numeric,
  total_votes integer,
  average_rating numeric,
  created_at timestamp with time zone,
  week_interval text
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_week_start DATE;
  current_week_end DATE;
  week_interval_text TEXT;
BEGIN
  -- Получаем дату начала текущей недели (понедельник)
  current_week_start := get_week_monday(CURRENT_DATE);
  current_week_end := current_week_start + INTERVAL '6 days';
  
  -- Формируем интервал недели
  week_interval_text := TO_CHAR(current_week_start, 'DD.MM') || '-' || TO_CHAR(current_week_end, 'DD.MM.YYYY');
  
  RETURN QUERY
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    p.first_name,
    p.last_name,
    p.age,
    p.city,
    p.country,
    p.photo_1_url,
    p.photo_2_url,
    p.height_cm,
    p.weight_kg,
    wcp.total_votes,
    wcp.average_rating,
    wcp.created_at,
    week_interval_text as week_interval
  FROM weekly_contest_participants wcp
  JOIN profiles p ON p.id = wcp.user_id
  WHERE wcp.is_active = true
    AND wcp.admin_status = 'next week'
    AND p.is_approved = true
    AND EXISTS (
      SELECT 1 
      FROM contest_applications ca 
      WHERE ca.user_id = wcp.user_id 
        AND ca.status = 'approved' 
        AND ca.is_active = true 
        AND ca.deleted_at IS NULL
    )
    -- Показываем только те карточки, которые получили статус "next week" в текущей неделе
    AND (
      -- Если нет истории статусов (новые записи), показываем их
      wcp.status_history IS NULL 
      OR wcp.status_history = '{}'::jsonb
      OR 
      -- Или если статус "next week" был назначен в текущей неделе
      (
        (wcp.status_history->'next week'->>'week_start_date')::date >= current_week_start
        OR 
        -- Или если запись была создана в текущей неделе
        wcp.created_at >= current_week_start::timestamp with time zone
      )
    )
  ORDER BY wcp.average_rating DESC NULLS LAST, wcp.total_votes DESC NULLS LAST;
END;
$$;

-- Создаем функцию для получения всех next week участников с интервалами недель для админки
CREATE OR REPLACE FUNCTION public.get_next_week_participants_admin()
RETURNS TABLE(
  participant_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  age integer,
  city text,
  country text,
  photo_1_url text,
  photo_2_url text,
  height_cm integer,
  weight_kg numeric,
  total_votes integer,
  average_rating numeric,
  created_at timestamp with time zone,
  week_interval text,
  status_assigned_date date
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    p.first_name,
    p.last_name,
    p.age,
    p.city,
    p.country,
    p.photo_1_url,
    p.photo_2_url,
    p.height_cm,
    p.weight_kg,
    wcp.total_votes,
    wcp.average_rating,
    wcp.created_at,
    CASE 
      WHEN wcp.status_history->'next week'->>'week_start_date' IS NOT NULL THEN
        -- Формируем интервал из истории статусов
        TO_CHAR((wcp.status_history->'next week'->>'week_start_date')::date, 'DD.MM') || '-' || 
        TO_CHAR((wcp.status_history->'next week'->>'week_start_date')::date + INTERVAL '6 days', 'DD.MM.YYYY')
      ELSE
        -- Формируем интервал из даты создания записи
        TO_CHAR(get_week_monday(wcp.created_at::date), 'DD.MM') || '-' || 
        TO_CHAR(get_week_monday(wcp.created_at::date) + INTERVAL '6 days', 'DD.MM.YYYY')
    END as week_interval,
    CASE 
      WHEN wcp.status_history->'next week'->>'week_start_date' IS NOT NULL THEN
        (wcp.status_history->'next week'->>'week_start_date')::date
      ELSE
        get_week_monday(wcp.created_at::date)
    END as status_assigned_date
  FROM weekly_contest_participants wcp
  JOIN profiles p ON p.id = wcp.user_id
  WHERE wcp.is_active = true
    AND wcp.admin_status = 'next week'
    AND p.is_approved = true
    AND EXISTS (
      SELECT 1 
      FROM contest_applications ca 
      WHERE ca.user_id = wcp.user_id 
        AND ca.status = 'approved' 
        AND ca.is_active = true 
        AND ca.deleted_at IS NULL
    )
  ORDER BY status_assigned_date DESC, wcp.average_rating DESC NULLS LAST, wcp.total_votes DESC NULLS LAST;
END;
$$;