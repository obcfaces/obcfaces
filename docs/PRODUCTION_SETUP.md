# Production Setup Guide
## Weekly Contest Transition System

---

## 🚀 Quick Start Checklist

- [ ] Database migration applied
- [ ] Edge Function deployed
- [ ] Cron job configured (Monday 00:00 UTC)
- [ ] Monitoring queries tested
- [ ] Dry-run successful
- [ ] Alerts configured
- [ ] Emergency rollback procedure documented

---

## ⏰ Cron Job Setup

### Supabase pg_cron Configuration

**Required Extensions:**
```sql
-- Enable in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Schedule Weekly Transition (Every Monday 00:00 UTC)

```sql
SELECT cron.schedule(
  'weekly-contest-transition',
  '0 0 * * 1',  -- Every Monday at 00:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-contest-transition',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object('time', now())
  ) as request_id;
  $$
);
```

**Important Notes:**
- Replace `YOUR_SERVICE_ROLE_KEY` with actual service role key from Supabase dashboard
- The function runs in UTC timezone
- Advisory lock prevents concurrent runs

### Optional: Safety Backup at 00:10 UTC

```sql
SELECT cron.schedule(
  'weekly-contest-transition-backup',
  '10 0 * * 1',  -- Every Monday at 00:10 UTC (10 min after main run)
  $$
  SELECT net.http_post(
    url := 'https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-contest-transition',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object('time', now())
  ) as request_id;
  $$
);
```

**Why?** If the first run fails/times out, the second run will either:
- Complete the transition (if first failed)
- Return "already_completed" (if first succeeded) - no changes

### View Scheduled Jobs

```sql
SELECT * FROM cron.job;
```

### Delete a Job (if needed)

```sql
SELECT cron.unschedule('weekly-contest-transition');
```

---

## 🧪 Testing & Dry Run

### 1. Test Dry Run (No Changes)

**Via Supabase Function URL:**
```bash
curl -X POST 'https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-contest-transition?dry_run=true' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Via SQL:**
```sql
SELECT transition_weekly_contest(
  target_week_start := get_current_monday_utc(),
  dry_run := TRUE
);
```

**Expected Output:**
```json
{
  "status": "dry_run",
  "week_start_date": "2025-10-13",
  "week_end_date": "2025-10-19",
  "transitions": {
    "thisWeekToPast": 5,
    "nextWeekOnSiteToThisWeek": 3,
    "preNextWeekToNextWeek": 8
  },
  "winner": {
    "id": "uuid",
    "user_id": "uuid",
    "average_rating": 4.8,
    "total_votes": 125
  },
  "snapshot": [...],
  "dry_run": true
}
```

### 2. Pre-Production Smoke Test

**Saturday/Sunday before Monday transition:**

```sql
-- Run full readiness check
SELECT * FROM current_week_summary;
SELECT * FROM check_orphaned_participants();
SELECT * FROM check_duplicate_winners();

-- Dry run for current week
SELECT transition_weekly_contest(
  target_week_start := get_current_monday_utc() + INTERVAL '7 days',
  dry_run := TRUE
);
```

**All checks should pass (0 errors).**

### 3. Manual Production Run (if cron fails)

```bash
curl -X POST 'https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-contest-transition' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Or via SQL:**
```sql
SELECT transition_weekly_contest(
  target_week_start := get_current_monday_utc()
);
```

---

## 📊 Daily Monitoring

### Automated Daily Health Check (9 AM UTC)

```sql
-- Add to cron for daily monitoring
SELECT cron.schedule(
  'daily-contest-health-check',
  '0 9 * * *',  -- Every day at 9 AM UTC
  $$
  -- Log results to monitoring table or send to alerting system
  SELECT 
    now() as check_time,
    (SELECT COUNT(*) FROM check_orphaned_participants()) as orphaned_count,
    (SELECT COUNT(*) FROM check_duplicate_winners()) as duplicate_winners,
    (SELECT COUNT(*) FROM weekly_contests WHERE status = 'active') as active_contests
  -- Store in monitoring_log table or export to external service
  $$
);
```

### Manual Queries (docs/MONITORING_QUERIES.sql)

Run these queries daily:

```sql
-- 1. Current week summary
SELECT * FROM current_week_summary;

-- 2. Check data integrity
SELECT * FROM check_orphaned_participants();
SELECT * FROM check_duplicate_winners();

-- 3. Recent transition history
SELECT id, week_start_date, status, started_at, finished_at,
       this_week_to_past_count, next_week_on_site_to_this_week_count,
       pre_next_week_to_next_week_count, winner_user_id
FROM weekly_transition_runs
ORDER BY started_at DESC
LIMIT 5;
```

---

## 🔔 Alerting Setup

### Critical Alerts (Immediate Action Required)

**Set up alerts for:**

1. **Multiple Active Contests**
   ```sql
   SELECT COUNT(*) FROM weekly_contests WHERE status = 'active';
   -- Alert if != 1
   ```

2. **Orphaned Participants**
   ```sql
   SELECT COUNT(*) FROM check_orphaned_participants();
   -- Alert if > 0
   ```

3. **Transition Failures**
   ```sql
   SELECT COUNT(*) FROM weekly_transition_runs 
   WHERE status = 'failed' 
   AND started_at > now() - INTERVAL '7 days';
   -- Alert if > 0
   ```

### Warning Alerts (Should Investigate)

1. **Low Participation**
   ```sql
   SELECT COUNT(*) FROM weekly_contest_participants
   WHERE admin_status = 'this week' AND deleted_at IS NULL;
   -- Alert if < 3
   ```

2. **No Next Week Participants**
   ```sql
   SELECT COUNT(*) FROM weekly_contest_participants
   WHERE admin_status = 'next week on site' AND deleted_at IS NULL;
   -- Alert if = 0 (on Friday/Saturday)
   ```

### Recommended Alerting Tools

- **Supabase Dashboard**: Set up email alerts for database errors
- **Sentry/Rollbar**: Monitor Edge Function errors
- **Discord/Slack Webhook**: Send notifications via Edge Function
- **Custom Monitoring**: Use `weekly_transition_runs` table for dashboards

---

## 🧯 Emergency Procedures

### Scenario 1: Transition Failed

**Symptoms:**
- Edge Function returns 500 error
- `weekly_transition_runs.status = 'failed'`

**Steps:**
1. Check error message:
   ```sql
   SELECT error_message FROM weekly_transition_runs 
   ORDER BY started_at DESC LIMIT 1;
   ```

2. Check database state:
   ```sql
   SELECT * FROM current_week_summary;
   SELECT * FROM check_orphaned_participants();
   ```

3. Fix data issues (if any), then re-run:
   ```sql
   SELECT transition_weekly_contest(target_week_start := get_current_monday_utc());
   ```

### Scenario 2: Duplicate Winners

**Symptoms:**
- `check_duplicate_winners()` returns rows

**Steps:**
1. Identify the issue:
   ```sql
   SELECT * FROM check_duplicate_winners();
   ```

2. Review transition run logs:
   ```sql
   SELECT * FROM weekly_transition_runs 
   WHERE week_start_date = 'YYYY-MM-DD'
   ORDER BY started_at;
   ```

3. Manual fix (if needed):
   ```sql
   -- Remove incorrect winner
   UPDATE weekly_contest_participants
   SET final_rank = NULL
   WHERE id = 'incorrect_winner_id';
   ```

### Scenario 3: Need to Rollback Week

**Currently:** No automated rollback (implement if needed)

**Manual Rollback Steps:**

1. Get snapshot from last run:
   ```sql
   SELECT snapshot FROM weekly_transition_runs
   WHERE week_start_date = 'YYYY-MM-DD'
   ORDER BY started_at DESC LIMIT 1;
   ```

2. Restore each participant manually:
   ```sql
   UPDATE weekly_contest_participants
   SET 
     admin_status = 'original_status',
     week_start_date = 'original_date',
     week_end_date = 'original_date',
     final_rank = NULL
   WHERE id = 'participant_id';
   ```

3. Update contest status:
   ```sql
   UPDATE weekly_contests
   SET status = 'active', winner_id = NULL
   WHERE week_start_date = 'YYYY-MM-DD';
   ```

---

## 📈 Performance Optimization

### Monitor Query Performance

```sql
-- Check transition duration
SELECT 
  AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) as avg_seconds,
  MAX(EXTRACT(EPOCH FROM (finished_at - started_at))) as max_seconds
FROM weekly_transition_runs
WHERE status = 'completed';
```

**Expected:** < 5 seconds for typical load (50-100 participants)

### Index Maintenance

```sql
-- Check index usage
SELECT 
  schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('weekly_contest_participants', 'weekly_contests')
ORDER BY idx_scan DESC;
```

### Analyze Tables (Run monthly)

```sql
ANALYZE weekly_contest_participants;
ANALYZE weekly_contests;
ANALYZE weekly_transition_runs;
```

---

## 🔐 Security Checklist

- [ ] Service role key stored securely (not in code)
- [ ] Edge Function only callable with auth
- [ ] RLS policies enabled on all tables
- [ ] Monitoring queries use security definer functions
- [ ] Advisory locks prevent concurrent runs
- [ ] Audit logs (weekly_transition_runs) retained for compliance

---

## 📝 Weekly Operations Checklist

### Friday/Saturday (Pre-transition Check)
- [ ] Run `SELECT * FROM current_week_summary;`
- [ ] Verify "this week" has participants
- [ ] Verify "next week on site" has participants ready
- [ ] Run dry-run: `SELECT transition_weekly_contest(..., TRUE);`
- [ ] Check all smoke tests pass

### Monday Morning (Post-transition Verify)
- [ ] Check Edge Function logs
- [ ] Verify transition completed successfully
- [ ] Check winner was assigned correctly
- [ ] Verify new "this week" participants
- [ ] Run orphaned participants check
- [ ] Run duplicate winners check

### Daily (Ongoing Monitoring)
- [ ] Review `current_week_summary`
- [ ] Check `weekly_transition_runs` for any failures
- [ ] Monitor participant growth trends

---

## 🛠️ Troubleshooting

### Edge Function Not Running

1. **Check cron job exists:**
   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE '%weekly-contest%';
   ```

2. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → weekly-contest-transition → Logs

3. **Test manually:**
   ```bash
   curl -X POST 'https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-contest-transition' \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

### Advisory Lock Timeout

**Error:** "Another transition is already running for week YYYY-MM-DD"

**Cause:** Previous run didn't finish (crashed/timed out)

**Solution:**
- Advisory locks are transaction-scoped - they auto-release on commit/rollback
- Wait a few minutes and retry
- If persistent, check for hung database connections

### Idempotency Check Failing

**Error:** "Transition already completed for this week"

**Explanation:** This is **not an error** - it's idempotency protection

**Meaning:** The transition already ran successfully for this week

**Action:** No action needed unless you need to force re-run (not recommended)

---

## 📚 Additional Resources

- **Monitoring Queries:** `docs/MONITORING_QUERIES.sql`
- **Edge Function Code:** `supabase/functions/weekly-contest-transition/index.ts`
- **Migration File:** Check latest migration in `supabase/migrations/`
- **Supabase Cron Docs:** https://supabase.com/docs/guides/database/extensions/pg_cron
- **Edge Functions Docs:** https://supabase.com/docs/guides/functions

---

## 🎯 Success Criteria

**System is working correctly if:**

✅ Weekly transition runs every Monday 00:00 UTC automatically  
✅ All participants transition to correct status  
✅ Winner is determined consistently  
✅ No orphaned participants  
✅ No duplicate winners  
✅ Transition completes in < 5 seconds  
✅ `weekly_transition_runs` logs all executions  
✅ Idempotency prevents duplicate runs  
✅ Advisory lock prevents concurrent runs  

---

**Last Updated:** 2025-10-12  
**System Version:** v2.0 (UTC-based, SQL-atomic, production-hardened)
