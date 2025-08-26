-- Создаем материализованные представления для быстрого доступа к статистике
CREATE MATERIALIZED VIEW IF NOT EXISTS participant_stats AS
SELECT 
  wcp.user_id,
  wcp.contest_id,
  COALESCE(AVG(cr.rating), 0) as avg_rating,
  COUNT(cr.rating) as total_ratings,
  wcp.application_data->>'first_name' as first_name,
  wcp.application_data->>'last_name' as last_name,
  wc.week_start_date,
  wc.week_end_date,
  wc.status as contest_status
FROM weekly_contest_participants wcp
LEFT JOIN contestant_ratings cr ON cr.contestant_user_id = wcp.user_id
LEFT JOIN weekly_contests wc ON wc.id = wcp.contest_id
WHERE wcp.is_active = true
GROUP BY wcp.user_id, wcp.contest_id, wcp.application_data, wc.week_start_date, wc.week_end_date, wc.status;

-- Создаем индекс для материализованного представления
CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_stats_user_contest 
ON participant_stats(user_id, contest_id);

-- Функция для обновления материализованного представления
CREATE OR REPLACE FUNCTION refresh_participant_stats()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY participant_stats;
$$;

-- Создаем функцию для архивирования старых данных
CREATE OR REPLACE FUNCTION archive_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Архивируем рейтинги старше 1 года
  DELETE FROM contestant_ratings 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Архивируем лайки старше 6 месяцев для неактивных участников
  DELETE FROM likes 
  WHERE created_at < NOW() - INTERVAL '6 months'
    AND content_type = 'contest'
    AND content_id NOT IN (
      SELECT DISTINCT CONCAT('contestant-user-', user_id) 
      FROM weekly_contest_participants 
      WHERE is_active = true
    );
    
  -- Обновляем статистику
  PERFORM refresh_participant_stats();
END;
$$;

-- Создаем функцию для оптимизации производительности
CREATE OR REPLACE FUNCTION get_contest_leaderboard(contest_week_offset integer DEFAULT 0)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  avatar_url text,
  avg_rating numeric,
  total_votes bigint,
  rank_position bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    ps.user_id,
    CONCAT(ps.first_name, ' ', ps.last_name) as full_name,
    p.avatar_url,
    ps.avg_rating,
    ps.total_ratings,
    ROW_NUMBER() OVER (ORDER BY ps.avg_rating DESC, ps.total_ratings DESC) as rank_position
  FROM participant_stats ps
  LEFT JOIN profiles p ON p.id = ps.user_id
  JOIN weekly_contests wc ON wc.id = ps.contest_id
  WHERE wc.week_start_date = (
    SELECT week_start_date 
    FROM weekly_contests 
    ORDER BY week_start_date DESC 
    OFFSET ABS(contest_week_offset) 
    LIMIT 1
  )
  ORDER BY ps.avg_rating DESC, ps.total_ratings DESC;
$$;