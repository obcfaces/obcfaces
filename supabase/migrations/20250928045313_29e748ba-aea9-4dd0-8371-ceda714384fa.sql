-- Удаляем старую функцию и создаем новую с учетом истории статусов
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
      -- Если статус "next week" был назначен в текущей неделе или позже
      (wcp.status_history->'next week'->>'changed_at')::timestamp with time zone >= current_week_start::timestamp with time zone
      OR 
      -- Или если запись была создана в текущей неделе и у неё нет истории статусов
      (wcp.created_at >= current_week_start::timestamp with time zone AND 
       (wcp.status_history IS NULL OR wcp.status_history = '{}'::jsonb))
    )
  ORDER BY wcp.average_rating DESC NULLS LAST, wcp.total_votes DESC NULLS LAST;
END;
$$;