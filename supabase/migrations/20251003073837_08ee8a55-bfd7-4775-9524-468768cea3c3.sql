-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_init_status_history ON weekly_contest_participants CASCADE;

-- Now drop the function
DROP FUNCTION IF EXISTS update_participant_status_history() CASCADE;

-- Also drop any other related triggers/functions
DROP TRIGGER IF EXISTS update_status_week_history_trigger ON weekly_contest_participants CASCADE;
DROP TRIGGER IF EXISTS track_status_changes ON weekly_contest_participants CASCADE;
DROP TRIGGER IF EXISTS log_status_week_history ON weekly_contest_participants CASCADE;

DROP FUNCTION IF EXISTS update_status_week_history() CASCADE;
DROP FUNCTION IF EXISTS track_status_changes() CASCADE;
DROP FUNCTION IF EXISTS log_status_week_history() CASCADE;