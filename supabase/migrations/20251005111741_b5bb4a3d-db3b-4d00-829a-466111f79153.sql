
-- Создаем функцию для получения рейтингов БЕЗ подозрительных пользователей
CREATE OR REPLACE FUNCTION public.get_clean_participant_rating_stats(target_participant_id uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*)::BIGINT as total_votes
  FROM contestant_ratings cr
  WHERE cr.participant_id = target_participant_id
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = cr.user_id 
      AND ur.role = 'suspicious'
    );
$$;

-- Обновляем все рейтинги участников, исключая оценки от подозрительных пользователей
UPDATE weekly_contest_participants wcp
SET 
  average_rating = COALESCE(stats.avg_rating, 0),
  total_votes = COALESCE(stats.vote_count, 0)
FROM (
  SELECT 
    cr.participant_id,
    AVG(cr.rating)::NUMERIC(3,1) as avg_rating,
    COUNT(*)::INTEGER as vote_count
  FROM contestant_ratings cr
  WHERE cr.participant_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = cr.user_id 
      AND ur.role = 'suspicious'
    )
  GROUP BY cr.participant_id
) stats
WHERE wcp.id = stats.participant_id;

-- Заменяем старую функцию на новую для использования в коде
CREATE OR REPLACE FUNCTION public.get_public_participant_rating_stats(target_participant_id uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Теперь всегда исключаем подозрительных пользователей
  SELECT * FROM get_clean_participant_rating_stats(target_participant_id);
$$;
