-- Удаляем существующую функцию
DROP FUNCTION IF EXISTS public.get_next_week_participants_public();

-- Создаем функцию для получения участников "next week" с учетом истории статусов
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
  created_at timestamp with time zone
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_week_start DATE;
BEGIN
  -- Получаем дату начала текущей недели (понедельник)
  current_week_start := get_week_monday(CURRENT_DATE);
  
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
    wcp.created_at
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