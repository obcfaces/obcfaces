-- Удаляем старые версии функций с неправильными параметрами
DROP FUNCTION IF EXISTS public.get_rating_stats(text, uuid);
DROP FUNCTION IF EXISTS public.get_contestant_average_rating(text, uuid);

-- Создаем новые версии с правильными параметрами
CREATE OR REPLACE FUNCTION public.get_rating_stats(
  contestant_name_param text,
  participant_id_param uuid DEFAULT NULL
)
RETURNS TABLE(average_rating numeric, total_votes bigint, rating_distribution json)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*) as total_votes,
    json_object_agg(rating, count) as rating_distribution
  FROM (
    SELECT 
      rating,
      COUNT(*) as count
    FROM contestant_ratings 
    WHERE contestant_name = contestant_name_param 
      AND (participant_id_param IS NULL OR participant_id = participant_id_param)
    GROUP BY rating
  ) rating_counts;
$$;

CREATE OR REPLACE FUNCTION public.get_contestant_average_rating(
  contestant_name_param text,
  participant_id_param uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1)
  FROM public.contestant_ratings 
  WHERE contestant_name = contestant_name_param 
    AND (participant_id_param IS NULL OR participant_id = participant_id_param);
$$;