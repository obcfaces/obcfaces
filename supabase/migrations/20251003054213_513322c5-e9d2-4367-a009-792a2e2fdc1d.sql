-- Remove unused 'status_week_history' column from weekly_contest_participants table
-- This field is not used in the codebase - all history tracking uses 'status_history'

-- First verify the column exists
DO $$ 
DECLARE 
  has_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'weekly_contest_participants' 
      AND column_name = 'status_week_history'
  ) INTO has_column;
  
  IF NOT has_column THEN
    RAISE EXCEPTION 'Column status_week_history does not exist in weekly_contest_participants';
  END IF;
  
  RAISE NOTICE 'Verified: status_week_history column exists and ready to be removed';
END $$;

-- Drop the status_week_history column
ALTER TABLE weekly_contest_participants 
DROP COLUMN IF EXISTS status_week_history;

-- Log the change
DO $$ 
BEGIN
  RAISE NOTICE 'Successfully removed unused status_week_history column from weekly_contest_participants';
  RAISE NOTICE 'All history tracking now uses status_history column only';
END $$;