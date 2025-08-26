-- Обновляем структуру для работы с user_id вместо имен

-- 1. Добавляем индексы для ускорения поиска по user_id
CREATE INDEX IF NOT EXISTS idx_contestant_ratings_user_id ON public.contestant_ratings(contestant_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_content_user ON public.likes(content_id) WHERE content_id LIKE 'contestant-user-%';
CREATE INDEX IF NOT EXISTS idx_photo_comments_content_user ON public.photo_comments(content_id) WHERE content_id LIKE 'contestant-user-%';

-- 2. Создаем улучшенную функцию для получения рейтингов по user_id
CREATE OR REPLACE FUNCTION public.get_user_rating_stats(target_user_id uuid)
RETURNS TABLE(
  average_rating numeric,
  total_votes bigint,
  user_has_voted boolean
) 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*) as total_votes,
    EXISTS(
      SELECT 1 FROM contestant_ratings 
      WHERE contestant_user_id = target_user_id 
        AND user_id = auth.uid()
    ) as user_has_voted
  FROM contestant_ratings 
  WHERE contestant_user_id = target_user_id;
$$;

-- 3. Функция для получения рейтинга текущего пользователя для конкретного участника
CREATE OR REPLACE FUNCTION public.get_my_rating_for_user(target_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT rating 
  FROM contestant_ratings 
  WHERE contestant_user_id = target_user_id 
    AND user_id = auth.uid()
  LIMIT 1;
$$;

-- 4. Функция для подсчета лайков по user_id
CREATE OR REPLACE FUNCTION public.get_user_likes_count(target_user_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM likes 
  WHERE (
    content_id = CONCAT('contestant-user-', target_user_id) OR
    content_id LIKE CONCAT('contestant-user-', target_user_id, '-%')
  );
$$;

-- 5. Функция для подсчета комментариев по user_id
CREATE OR REPLACE FUNCTION public.get_user_comments_count(target_user_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM photo_comments 
  WHERE (
    content_id = CONCAT('contestant-user-', target_user_id) OR
    content_id LIKE CONCAT('contestant-user-', target_user_id, '-%')
  );
$$;

-- 6. Функция для проверки лайка текущего пользователя
CREATE OR REPLACE FUNCTION public.check_user_liked_participant(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM likes 
    WHERE user_id = auth.uid()
      AND (
        content_id = CONCAT('contestant-user-', target_user_id) OR
        content_id LIKE CONCAT('contestant-user-', target_user_id, '-%')
      )
  );
$$;

-- 7. Обновляем существующую функцию для получения рейтинга пользователем
DROP FUNCTION IF EXISTS public.get_user_rating(text);
CREATE OR REPLACE FUNCTION public.get_user_rating_for_participant(target_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT rating 
  FROM contestant_ratings 
  WHERE contestant_user_id = target_user_id 
    AND user_id = auth.uid()
  LIMIT 1;
$$;