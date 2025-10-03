-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS trigger_record_status_change ON weekly_contest_participants CASCADE;
DROP FUNCTION IF EXISTS record_status_change() CASCADE;

-- Also drop the function it depends on if it exists
DROP FUNCTION IF EXISTS get_current_week_interval() CASCADE;