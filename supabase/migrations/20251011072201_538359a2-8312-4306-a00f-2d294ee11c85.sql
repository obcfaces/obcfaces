-- Индексы для weekly_contest_participants
CREATE INDEX IF NOT EXISTS idx_wcp_admin_status ON weekly_contest_participants(admin_status);
CREATE INDEX IF NOT EXISTS idx_wcp_week_interval ON weekly_contest_participants(week_interval);
CREATE INDEX IF NOT EXISTS idx_wcp_created_at ON weekly_contest_participants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wcp_deleted_at ON weekly_contest_participants(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wcp_is_active ON weekly_contest_participants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_wcp_user_id ON weekly_contest_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_wcp_contest_id ON weekly_contest_participants(contest_id);

-- Композитные индексы для частых фильтров
CREATE INDEX IF NOT EXISTS idx_wcp_status_active ON weekly_contest_participants(admin_status, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wcp_week_status ON weekly_contest_participants(week_interval, admin_status) WHERE is_active = true;

-- Индексы для contestant_ratings
CREATE INDEX IF NOT EXISTS idx_ratings_participant_id ON contestant_ratings(participant_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON contestant_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_week_interval ON contestant_ratings(week_interval);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON contestant_ratings(created_at DESC);

-- Композитный индекс для статистики
CREATE INDEX IF NOT EXISTS idx_ratings_participant_rating ON contestant_ratings(participant_id, rating);

-- Индексы для likes
CREATE INDEX IF NOT EXISTS idx_likes_participant_id ON likes(participant_id);
CREATE INDEX IF NOT EXISTS idx_likes_content ON likes(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_content ON likes(user_id, content_type, content_id);

-- Индексы для profiles
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_profiles_participant ON profiles(is_contest_participant) WHERE is_contest_participant = true;
CREATE INDEX IF NOT EXISTS idx_profiles_privacy ON profiles(privacy_level, is_approved);

-- Индексы для weekly_contests
CREATE INDEX IF NOT EXISTS idx_contests_dates ON weekly_contests(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_contests_status ON weekly_contests(status, week_start_date);