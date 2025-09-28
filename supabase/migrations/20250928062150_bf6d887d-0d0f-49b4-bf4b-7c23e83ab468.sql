-- Fix the RPC function to return 'id' instead of 'participant_id' to match frontend expectations
DROP FUNCTION IF EXISTS public.get_next_week_participants_admin();

CREATE OR REPLACE FUNCTION public.get_next_week_participants_admin()
RETURNS TABLE(
  id uuid,
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
    wcp.id,
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
        'Unknown Week'
    END as week_interval,
    COALESCE(
      (wcp.status_history->'next week'->>'week_start_date')::date,
      (wcp.status_history->'next week on site'->>'week_start_date')::date,
      CURRENT_DATE
    ) as status_assigned_date,
    COALESCE(wcp.admin_status, 'next week') as admin_status
  FROM weekly_contest_participants wcp
  LEFT JOIN profiles p ON p.id = wcp.user_id
  WHERE (
    wcp.admin_status IN ('next week', 'next week on site') OR
    (
      wcp.admin_status IS NULL AND 
      (
        -- Участник был добавлен на эту неделю
        wcp.status_history ? 'next week' OR
        wcp.status_history ? 'next week on site' OR
        -- Или если запись была создана в текущей неделе
        wcp.created_at >= (SELECT get_week_monday(CURRENT_DATE))::timestamp with time zone
      )
    )
  )
  ORDER BY wcp.average_rating DESC NULLS LAST, wcp.total_votes DESC NULLS LAST;
END;
$$;