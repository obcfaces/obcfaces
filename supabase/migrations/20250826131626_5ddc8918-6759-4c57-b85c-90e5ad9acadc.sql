-- Удаляем небезопасную политику, которая позволяет видеть все рейтинги
DROP POLICY IF EXISTS "Users can view all ratings" ON public.contestant_ratings;

-- Создаем новые безопасные политики
-- Пользователи могут видеть только свои собственные рейтинги
CREATE POLICY "Users can view their own ratings" 
ON public.contestant_ratings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Администраторы и модераторы могут видеть все рейтинги для управления
CREATE POLICY "Admins and moderators can view all ratings" 
ON public.contestant_ratings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Создаем функцию для безопасного получения агрегированных данных о рейтингах
-- без раскрытия индивидуальных голосов
CREATE OR REPLACE FUNCTION public.get_rating_stats(contestant_name_param text, contestant_user_id_param uuid DEFAULT NULL)
RETURNS TABLE(
  average_rating numeric,
  total_votes bigint,
  rating_distribution json
) 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
SET search_path = public
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
      AND (contestant_user_id_param IS NULL OR contestant_user_id = contestant_user_id_param)
    GROUP BY rating
  ) rating_counts;
$$;

-- Создаем функцию для проверки, голосовал ли пользователь за конкретного участника
CREATE OR REPLACE FUNCTION public.check_user_voted(contestant_name_param text, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM contestant_ratings 
    WHERE contestant_name = contestant_name_param 
      AND user_id = user_id_param
  );
$$;

-- Создаем функцию для получения рейтинга пользователя (только для него самого)
CREATE OR REPLACE FUNCTION public.get_user_rating(contestant_name_param text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT rating 
  FROM contestant_ratings 
  WHERE contestant_name = contestant_name_param 
    AND user_id = auth.uid()
  LIMIT 1;
$$;