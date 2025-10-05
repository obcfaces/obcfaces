
-- Исправляем функцию get_public_participant_rating_stats
CREATE OR REPLACE FUNCTION public.get_public_participant_rating_stats(target_participant_id uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Теперь используем только participant_id
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*)::BIGINT as total_votes
  FROM contestant_ratings
  WHERE participant_id = target_participant_id;
$$;

-- Также пересчитаем все рейтинги в weekly_contest_participants
UPDATE weekly_contest_participants wcp
SET 
  average_rating = COALESCE(stats.avg_rating, 0),
  total_votes = COALESCE(stats.vote_count, 0)
FROM (
  SELECT 
    participant_id,
    AVG(rating) as avg_rating,
    COUNT(*) as vote_count
  FROM contestant_ratings
  WHERE participant_id IS NOT NULL
  GROUP BY participant_id
) stats
WHERE wcp.id = stats.participant_id;
