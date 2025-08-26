-- Добавляем важные индексы для оптимизации запросов
-- Индексы для частых запросов по участникам
CREATE INDEX IF NOT EXISTS idx_weekly_contest_participants_user_contest 
ON weekly_contest_participants(user_id, contest_id);

CREATE INDEX IF NOT EXISTS idx_weekly_contest_participants_contest_active 
ON weekly_contest_participants(contest_id, is_active) 
WHERE is_active = true;

-- Индексы для системы рейтингов
CREATE INDEX IF NOT EXISTS idx_contestant_ratings_user_rating 
ON contestant_ratings(contestant_user_id, rating);

CREATE INDEX IF NOT EXISTS idx_contestant_ratings_created 
ON contestant_ratings(created_at DESC);

-- Индексы для лайков и комментариев  
CREATE INDEX IF NOT EXISTS idx_likes_content_created 
ON likes(content_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_photo_comments_content_created 
ON photo_comments(content_type, created_at DESC);

-- Индексы для заявок
CREATE INDEX IF NOT EXISTS idx_contest_applications_status_date 
ON contest_applications(status, submitted_at DESC) 
WHERE is_active = true;

-- Индексы для конкурсов
CREATE INDEX IF NOT EXISTS idx_weekly_contests_status_dates 
ON weekly_contests(status, week_start_date, week_end_date);

-- Добавляем партиционирование для больших таблиц (по датам)
-- Это поможет при росте данных
CREATE TABLE IF NOT EXISTS contestant_ratings_partitioned (
  LIKE contestant_ratings INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Создаем партиции по месяцам (пример для текущего года)
CREATE TABLE IF NOT EXISTS contestant_ratings_2025_08 
PARTITION OF contestant_ratings_partitioned 
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE IF NOT EXISTS contestant_ratings_2025_09 
PARTITION OF contestant_ratings_partitioned 
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');