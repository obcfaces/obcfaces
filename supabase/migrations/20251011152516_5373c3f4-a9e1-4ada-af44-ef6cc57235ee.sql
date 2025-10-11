-- ============================================
-- 📊 Analytics Views for Growth Phase v1.1
-- ============================================

-- 1. Registrations per day (last 30 days)
CREATE OR REPLACE VIEW public.analytics_registrations_per_day AS
SELECT 
  date_trunc('day', created_at)::date as day,
  COUNT(*) as signups
FROM public.profiles
WHERE created_at >= now() - interval '30 days'
GROUP BY day
ORDER BY day DESC;

-- 2. Voting activity per day (last 30 days)
CREATE OR REPLACE VIEW public.analytics_votes_per_day AS
SELECT 
  date_trunc('day', created_at)::date as day,
  COUNT(*) as votes,
  AVG(rating)::numeric(3,1) as avg_rating
FROM public.contestant_ratings
WHERE created_at >= now() - interval '30 days'
GROUP BY day
ORDER BY day DESC;

-- 3. Top countries (last 7 days)
CREATE OR REPLACE VIEW public.analytics_top_countries_week AS
SELECT 
  country,
  COUNT(*) as user_count
FROM public.profiles
WHERE created_at >= now() - interval '7 days'
  AND country IS NOT NULL
GROUP BY country
ORDER BY user_count DESC
LIMIT 10;

-- 4. Conversion metrics
CREATE OR REPLACE VIEW public.analytics_conversion_metrics AS
WITH total_users AS (
  SELECT COUNT(DISTINCT id) as total FROM public.profiles
),
weekly_voters AS (
  SELECT COUNT(DISTINCT user_id) as total 
  FROM public.contestant_ratings
  WHERE created_at >= now() - interval '7 days'
),
today_registrations AS (
  SELECT COUNT(*) as total
  FROM public.profiles
  WHERE created_at >= date_trunc('day', now())
)
SELECT 
  (SELECT total FROM total_users) as total_users,
  (SELECT total FROM weekly_voters) as weekly_voters,
  (SELECT total FROM today_registrations) as today_registrations,
  ROUND(
    (SELECT total FROM weekly_voters)::numeric / 
    NULLIF((SELECT total FROM total_users), 0) * 100, 
    2
  ) as conversion_rate;

-- Grant access to authenticated users (admins will be checked via RLS)
GRANT SELECT ON public.analytics_registrations_per_day TO authenticated;
GRANT SELECT ON public.analytics_votes_per_day TO authenticated;
GRANT SELECT ON public.analytics_top_countries_week TO authenticated;
GRANT SELECT ON public.analytics_conversion_metrics TO authenticated;

COMMENT ON VIEW public.analytics_registrations_per_day IS 'Daily registration counts for the last 30 days';
COMMENT ON VIEW public.analytics_votes_per_day IS 'Daily voting activity and average ratings for the last 30 days';
COMMENT ON VIEW public.analytics_top_countries_week IS 'Top 10 countries by user count in the last 7 days';
COMMENT ON VIEW public.analytics_conversion_metrics IS 'Key conversion metrics including total users, weekly voters, and conversion rate';