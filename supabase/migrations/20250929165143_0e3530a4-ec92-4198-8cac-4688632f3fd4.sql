-- Add week_interval column to weekly_contest_participants table if it doesn't exist
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weekly_contest_participants' 
                   AND column_name = 'week_interval') THEN
        -- Add the column
        ALTER TABLE weekly_contest_participants 
        ADD COLUMN week_interval TEXT;
        
        RAISE NOTICE 'Column week_interval added to weekly_contest_participants table';
    ELSE
        RAISE NOTICE 'Column week_interval already exists in weekly_contest_participants table';
    END IF;
END $$;