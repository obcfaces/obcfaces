-- Удаляем функцию и создаем заново с исправленной логикой
DROP FUNCTION IF EXISTS public.get_next_week_participants_admin();

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
  status_assigned_date date,
  admin_status text
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
      WHEN wcp.status_history->'next week on site'->>'week_start_date' IS NOT NULL THEN
        -- Формируем интервал для next week on site
        TO_CHAR((wcp.status_history->'next week on site'->>'week_start_date')::date, 'DD.MM') || '-' || 
        TO_CHAR((wcp.status_history->'next week on site'->>'week_start_date')::date + INTERVAL '6 days', 'DD.MM.YYYY')
      ELSE
        -- Формируем интервал из даты создания записи
        TO_CHAR(get_week_monday(wcp.created_at::date), 'DD.MM') || '-' || 
        TO_CHAR(get_week_monday(wcp.created_at::date) + INTERVAL '6 days', 'DD.MM.YYYY')
    END as week_interval,
    CASE 
      WHEN wcp.status_history->'next week'->>'week_start_date' IS NOT NULL THEN
        (wcp.status_history->'next week'->>'week_start_date')::date
      WHEN wcp.status_history->'next week on site'->>'week_start_date' IS NOT NULL THEN
        (wcp.status_history->'next week on site'->>'week_start_date')::date
      ELSE
        get_week_monday(wcp.created_at::date)
    END as status_assigned_date,
    wcp.admin_status
  FROM weekly_contest_participants wcp
  LEFT JOIN profiles p ON p.id = wcp.user_id
  WHERE wcp.is_active = true
    AND wcp.admin_status IN ('next week', 'next week on site')
    -- Убираем требование approved статуса - показываем всех участников с next week статусом
  ORDER BY status_assigned_date DESC, wcp.average_rating DESC NULLS LAST, wcp.total_votes DESC NULLS LAST;
END;
$$;