-- Fix missing contestant_user_id column in contestant_ratings
ALTER TABLE public.contestant_ratings 
ADD COLUMN IF NOT EXISTS contestant_user_id UUID;

-- Create comprehensive indexes for performance optimization
-- Indexes for contestant_ratings table
CREATE INDEX IF NOT EXISTS idx_contestant_ratings_user_participant 
ON public.contestant_ratings(user_id, participant_id);

CREATE INDEX IF NOT EXISTS idx_contestant_ratings_participant_rating 
ON public.contestant_ratings(participant_id, rating DESC);

CREATE INDEX IF NOT EXISTS idx_contestant_ratings_contestant_user 
ON public.contestant_ratings(contestant_user_id) 
WHERE contestant_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contestant_ratings_week_interval 
ON public.contestant_ratings(week_interval);

CREATE INDEX IF NOT EXISTS idx_contestant_ratings_created_at 
ON public.contestant_ratings(created_at DESC);

-- Indexes for likes table
CREATE INDEX IF NOT EXISTS idx_likes_content_lookup 
ON public.likes(content_type, content_id, user_id);

CREATE INDEX IF NOT EXISTS idx_likes_participant_user 
ON public.likes(participant_id, user_id) 
WHERE participant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_likes_created_at 
ON public.likes(created_at DESC);

-- Indexes for weekly_contest_participants table
CREATE INDEX IF NOT EXISTS idx_wcp_admin_status_active 
ON public.weekly_contest_participants(admin_status, is_active) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wcp_user_id_active 
ON public.weekly_contest_participants(user_id) 
WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wcp_week_interval 
ON public.weekly_contest_participants(week_interval);

CREATE INDEX IF NOT EXISTS idx_wcp_ratings 
ON public.weekly_contest_participants(average_rating DESC, total_votes DESC) 
WHERE is_active = true;

-- Indexes for photo_comments table
CREATE INDEX IF NOT EXISTS idx_photo_comments_content 
ON public.photo_comments(content_type, content_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_photo_comments_participant 
ON public.photo_comments(participant_id, created_at DESC) 
WHERE participant_id IS NOT NULL;

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time 
ON public.messages(conversation_id, created_at DESC) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON public.messages(sender_id, created_at DESC);

-- Indexes for conversation_participants table
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user 
ON public.conversation_participants(user_id, last_read_at);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_contest_participant 
ON public.profiles(is_contest_participant, is_approved) 
WHERE is_contest_participant = true;

CREATE INDEX IF NOT EXISTS idx_profiles_approved_privacy 
ON public.profiles(is_approved, privacy_level);

-- Indexes for posts table
CREATE INDEX IF NOT EXISTS idx_posts_user_created 
ON public.posts(user_id, created_at DESC);

-- Indexes for user_voting_stats table
CREATE INDEX IF NOT EXISTS idx_user_voting_stats_user 
ON public.user_voting_stats(user_id, is_regular_voter);

-- Create materialized view for cached voting statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cached_voting_stats AS
SELECT 
  cr.participant_id,
  cr.contestant_user_id,
  COUNT(DISTINCT cr.user_id) as total_voters,
  AVG(cr.rating)::NUMERIC(3,1) as average_rating,
  COUNT(*) as total_votes,
  MAX(cr.created_at) as last_vote_at,
  cr.week_interval
FROM public.contestant_ratings cr
WHERE cr.participant_id IS NOT NULL
GROUP BY cr.participant_id, cr.contestant_user_id, cr.week_interval;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cached_voting_stats_participant 
ON public.cached_voting_stats(participant_id);

CREATE INDEX IF NOT EXISTS idx_cached_voting_stats_user 
ON public.cached_voting_stats(contestant_user_id) 
WHERE contestant_user_id IS NOT NULL;

-- Create materialized view for participant engagement stats
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cached_participant_engagement AS
SELECT 
  wcp.id as participant_id,
  wcp.user_id,
  wcp.week_interval,
  COUNT(DISTINCT l.user_id) as total_likes,
  COUNT(DISTINCT pc.user_id) as total_commenters,
  COUNT(DISTINCT cr.user_id) as total_raters,
  COALESCE(AVG(cr.rating), 0)::NUMERIC(3,1) as avg_rating
FROM public.weekly_contest_participants wcp
LEFT JOIN public.likes l ON l.participant_id = wcp.id
LEFT JOIN public.photo_comments pc ON pc.participant_id = wcp.id
LEFT JOIN public.contestant_ratings cr ON cr.participant_id = wcp.id
WHERE wcp.is_active = true AND wcp.deleted_at IS NULL
GROUP BY wcp.id, wcp.user_id, wcp.week_interval;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cached_engagement_participant 
ON public.cached_participant_engagement(participant_id);

-- Function to refresh voting statistics cache
CREATE OR REPLACE FUNCTION public.refresh_voting_stats_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.cached_voting_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.cached_participant_engagement;
$$;

-- Trigger to auto-refresh cache when ratings change
CREATE OR REPLACE FUNCTION public.schedule_voting_stats_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark for refresh (will be done by scheduled job)
  PERFORM pg_notify('refresh_voting_stats', '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_refresh_voting_stats ON public.contestant_ratings;
CREATE TRIGGER trigger_refresh_voting_stats
AFTER INSERT OR UPDATE OR DELETE ON public.contestant_ratings
FOR EACH STATEMENT
EXECUTE FUNCTION public.schedule_voting_stats_refresh();

-- Optimize storage for large tables
ALTER TABLE public.contestant_ratings SET (fillfactor = 90);
ALTER TABLE public.likes SET (fillfactor = 90);
ALTER TABLE public.messages SET (fillfactor = 85);
ALTER TABLE public.photo_comments SET (fillfactor = 90);

-- Update table statistics for query planner
ANALYZE public.contestant_ratings;
ANALYZE public.likes;
ANALYZE public.weekly_contest_participants;
ANALYZE public.photo_comments;
ANALYZE public.messages;
ANALYZE public.profiles;