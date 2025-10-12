-- ========================================
-- WEEKLY CONTEST TRANSITION MONITORING
-- Production-ready SQL queries for daily checks
-- ========================================

-- ========================================
-- DAILY HEALTH CHECKS
-- Run these every day to ensure system integrity
-- ========================================

-- 1. CURRENT WEEK SUMMARY
-- Shows participant counts by status for current week
SELECT * FROM current_week_summary;

-- 2. CHECK FOR ORPHANED PARTICIPANTS
-- Should return 0 rows - participants without proper week assignment
SELECT * FROM check_orphaned_participants();

-- 3. CHECK FOR DUPLICATE WINNERS
-- Should return 0 rows - ensures data integrity
SELECT * FROM check_duplicate_winners();

-- 4. LAST 5 TRANSITION RUNS
-- Review recent transition history and results
SELECT 
  id,
  week_start_date,
  status,
  started_at,
  finished_at,
  (finished_at - started_at) AS duration,
  this_week_to_past_count,
  next_week_on_site_to_this_week_count,
  pre_next_week_to_next_week_count,
  winner_id,
  winner_user_id,
  winner_avg_rating,
  winner_total_votes,
  error_message
FROM weekly_transition_runs
ORDER BY started_at DESC
LIMIT 5;

-- ========================================
-- DETAILED ANALYTICS
-- ========================================

-- 5. PARTICIPANTS DISTRIBUTION BY WEEK
-- See how participants are distributed across weeks
SELECT 
  week_start_date,
  admin_status,
  COUNT(*) as participant_count,
  AVG(average_rating) as avg_rating,
  SUM(total_votes) as total_votes
FROM weekly_contest_participants
WHERE deleted_at IS NULL
GROUP BY week_start_date, admin_status
ORDER BY week_start_date DESC, admin_status;

-- 6. WINNERS HISTORY (Last 10 weeks)
-- Review past winners and their stats
SELECT 
  wc.week_start_date,
  wc.week_end_date,
  wc.status,
  wc.winner_id,
  p.application_data->>'first_name' || ' ' || p.application_data->>'last_name' as winner_name,
  wcp.average_rating as final_rating,
  wcp.total_votes as final_votes,
  wcp.final_rank
FROM weekly_contests wc
LEFT JOIN weekly_contest_participants wcp ON wcp.id = wc.winner_id
LEFT JOIN profiles p ON p.id = wcp.user_id
WHERE wc.status = 'closed'
ORDER BY wc.week_start_date DESC
LIMIT 10;

-- 7. ACTIVE CONTEST STATUS
-- Should only have ONE active contest
SELECT 
  week_start_date,
  week_end_date,
  status,
  created_at,
  updated_at
FROM weekly_contests
WHERE status = 'active'
ORDER BY week_start_date DESC;

-- 8. TRANSITION RUN FAILURES
-- Check for any failed transitions that need attention
SELECT 
  id,
  week_start_date,
  started_at,
  finished_at,
  error_message,
  this_week_to_past_count,
  next_week_on_site_to_this_week_count,
  pre_next_week_to_next_week_count
FROM weekly_transition_runs
WHERE status = 'failed'
ORDER BY started_at DESC
LIMIT 10;

-- ========================================
-- DATA INTEGRITY CHECKS
-- ========================================

-- 9. PARTICIPANTS WITHOUT PROFILES
-- Should return 0 rows - every participant must have a profile
SELECT 
  wcp.id,
  wcp.user_id,
  wcp.admin_status,
  wcp.week_start_date
FROM weekly_contest_participants wcp
LEFT JOIN profiles p ON p.id = wcp.user_id
WHERE p.id IS NULL
  AND wcp.deleted_at IS NULL
LIMIT 20;

-- 10. MULTIPLE WINNERS IN SAME WEEK
-- Should return 0 rows
SELECT 
  week_start_date,
  COUNT(*) as winner_count
FROM weekly_contest_participants
WHERE final_rank = 1
  AND deleted_at IS NULL
GROUP BY week_start_date
HAVING COUNT(*) > 1;

-- 11. PARTICIPANTS WITH INVALID WEEK DATES
-- week_end_date should always be week_start_date + 6 days
SELECT 
  id,
  user_id,
  admin_status,
  week_start_date,
  week_end_date,
  week_end_date - week_start_date as day_difference
FROM weekly_contest_participants
WHERE week_start_date IS NOT NULL
  AND week_end_date IS NOT NULL
  AND week_end_date != week_start_date + INTERVAL '6 days'
  AND deleted_at IS NULL
LIMIT 20;

-- ========================================
-- PERFORMANCE MONITORING
-- ========================================

-- 12. TRANSITION RUN PERFORMANCE
-- Average duration and success rate
SELECT 
  status,
  COUNT(*) as run_count,
  AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) as avg_duration_seconds,
  MIN(EXTRACT(EPOCH FROM (finished_at - started_at))) as min_duration_seconds,
  MAX(EXTRACT(EPOCH FROM (finished_at - started_at))) as max_duration_seconds
FROM weekly_transition_runs
WHERE finished_at IS NOT NULL
GROUP BY status
ORDER BY status;

-- 13. PARTICIPANT ACTIVITY BY STATUS
-- Current snapshot of all participants
SELECT 
  admin_status,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE week_start_date IS NOT NULL) as with_week_date,
  COUNT(*) FILTER (WHERE week_start_date IS NULL) as without_week_date,
  AVG(average_rating) as avg_rating,
  SUM(total_votes) as total_votes
FROM weekly_contest_participants
WHERE deleted_at IS NULL
GROUP BY admin_status
ORDER BY admin_status;

-- ========================================
-- WEEKLY STATISTICS
-- ========================================

-- 14. VOTES AND RATINGS TREND (Last 8 weeks)
-- See engagement trends over time
WITH weekly_stats AS (
  SELECT 
    wc.week_start_date,
    wc.status,
    COUNT(DISTINCT wcp.id) as participant_count,
    SUM(wcp.total_votes) as total_votes,
    AVG(wcp.average_rating) as avg_rating,
    MAX(wcp.average_rating) as max_rating
  FROM weekly_contests wc
  LEFT JOIN weekly_contest_participants wcp 
    ON wcp.week_start_date = wc.week_start_date
    AND wcp.deleted_at IS NULL
  GROUP BY wc.week_start_date, wc.status
)
SELECT 
  week_start_date,
  status,
  participant_count,
  total_votes,
  ROUND(avg_rating::numeric, 2) as avg_rating,
  ROUND(max_rating::numeric, 2) as max_rating,
  CASE 
    WHEN total_votes > 0 THEN ROUND((total_votes::numeric / NULLIF(participant_count, 0)), 2)
    ELSE 0
  END as votes_per_participant
FROM weekly_stats
ORDER BY week_start_date DESC
LIMIT 8;

-- ========================================
-- BEFORE-MONDAY SMOKE TEST
-- Run this before weekly transition
-- ========================================

-- 15. PRE-TRANSITION READINESS CHECK
-- Comprehensive check before running transition
SELECT 
  'Active Contest' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    WHEN COUNT(*) = 0 THEN '❌ FAIL: No active contest'
    ELSE '❌ FAIL: Multiple active contests'
  END as status,
  COUNT(*) as count
FROM weekly_contests
WHERE status = 'active'

UNION ALL

SELECT 
  'This Week Participants',
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '⚠️ WARNING: No participants in this week'
  END,
  COUNT(*)
FROM weekly_contest_participants
WHERE admin_status = 'this week'
  AND deleted_at IS NULL

UNION ALL

SELECT 
  'Next Week On Site',
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END,
  COUNT(*)
FROM weekly_contest_participants
WHERE admin_status = 'next week on site'
  AND deleted_at IS NULL

UNION ALL

SELECT 
  'Orphaned Participants',
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL: Found orphaned participants'
  END,
  COUNT(*)
FROM check_orphaned_participants()

UNION ALL

SELECT 
  'Duplicate Winners',
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL: Found duplicate winners'
  END,
  COUNT(*)
FROM check_duplicate_winners();

-- ========================================
-- EMERGENCY QUERIES
-- Use these when something goes wrong
-- ========================================

-- 16. ROLLBACK INFORMATION FOR LAST RUN
-- Get snapshot data from last transition (if available)
SELECT 
  id as run_id,
  week_start_date,
  started_at,
  finished_at,
  status,
  this_week_to_past_count,
  next_week_on_site_to_this_week_count,
  pre_next_week_to_next_week_count,
  winner_id,
  winner_user_id
FROM weekly_transition_runs
ORDER BY started_at DESC
LIMIT 1;

-- 17. MANUAL PARTICIPANT STATUS UPDATE (EMERGENCY ONLY)
-- Template for manual status fix - ALWAYS log reason in status_history
/*
UPDATE weekly_contest_participants
SET 
  admin_status = 'desired_status',
  week_start_date = 'YYYY-MM-DD',
  week_end_date = 'YYYY-MM-DD',
  status_history = COALESCE(status_history, '{}'::jsonb) || 
    jsonb_build_object(
      'manual_fix_' || to_char(now(), 'YYYY-MM-DD_HH24:MI:SS'),
      jsonb_build_object(
        'changed_at', now(),
        'changed_by', 'admin_user_id',
        'change_reason', 'DETAILED REASON FOR MANUAL FIX',
        'old_status', admin_status,
        'new_status', 'desired_status',
        'timestamp', now()
      )
    )
WHERE id = 'participant_id';
*/

-- ========================================
-- ALERTING THRESHOLDS
-- Set up alerts based on these queries
-- ========================================

-- 18. CRITICAL ALERTS (Should trigger immediate action)
SELECT 
  'CRITICAL' as severity,
  'Multiple Active Contests' as alert_type,
  COUNT(*) as count,
  'Expected: 1, Found: ' || COUNT(*) as message
FROM weekly_contests
WHERE status = 'active'
HAVING COUNT(*) != 1

UNION ALL

SELECT 
  'CRITICAL',
  'Orphaned Participants',
  COUNT(*),
  'Found ' || COUNT(*) || ' participants without proper week assignment'
FROM check_orphaned_participants()
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'CRITICAL',
  'Duplicate Winners',
  COUNT(*),
  'Found ' || COUNT(*) || ' weeks with multiple winners'
FROM check_duplicate_winners()
HAVING COUNT(*) > 0;

-- 19. WARNING ALERTS (Should be investigated)
SELECT 
  'WARNING' as severity,
  'Low Participation' as alert_type,
  participant_count,
  'Current week has only ' || participant_count || ' participants'
FROM (
  SELECT COUNT(*) as participant_count
  FROM weekly_contest_participants
  WHERE admin_status = 'this week'
    AND deleted_at IS NULL
) subquery
WHERE participant_count < 3;

-- ========================================
-- USAGE EXAMPLES
-- ========================================

/*
-- Run daily at 9 AM UTC (automated via cron job or monitoring dashboard):
SELECT * FROM current_week_summary;
SELECT * FROM check_orphaned_participants();
SELECT * FROM check_duplicate_winners();

-- Run before Monday transition (Saturday/Sunday):
SELECT * FROM [Query #15: PRE-TRANSITION READINESS CHECK];

-- Investigate issues:
SELECT * FROM weekly_transition_runs WHERE status = 'failed' ORDER BY started_at DESC LIMIT 5;

-- Performance analysis:
SELECT * FROM [Query #12: TRANSITION RUN PERFORMANCE];
SELECT * FROM [Query #14: VOTES AND RATINGS TREND];
*/
