-- Drop the old trigger that references the wrong column name
DROP TRIGGER IF EXISTS update_status_week_history_trigger ON weekly_contest_participants;

-- Drop the old function that references status_week_history
DROP FUNCTION IF EXISTS update_status_week_history();

-- The status_history column already exists and is being used correctly
-- No need to create a new trigger since the application code handles status_history updates