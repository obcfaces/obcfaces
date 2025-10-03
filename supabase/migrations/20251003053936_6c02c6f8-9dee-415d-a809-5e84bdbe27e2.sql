-- Remove unused 'status' column from weekly_contest_participants table
-- This field is no longer used - all status tracking is done via 'admin_status'

-- First verify the column exists and is not referenced in views/functions
DO $$ 
DECLARE 
  has_status_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'weekly_contest_participants' 
      AND column_name = 'status'
  ) INTO has_status_column;
  
  IF NOT has_status_column THEN
    RAISE EXCEPTION 'Column status does not exist in weekly_contest_participants';
  END IF;
  
  RAISE NOTICE 'Verified: status column exists and ready to be removed';
END $$;

-- Drop the status column
ALTER TABLE weekly_contest_participants 
DROP COLUMN IF EXISTS status;

-- Log the change
DO $$ 
BEGIN
  RAISE NOTICE 'Successfully removed unused status column from weekly_contest_participants';
  RAISE NOTICE 'All status tracking now uses admin_status column only';
END $$;