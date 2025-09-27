-- Create enum for participant status
CREATE TYPE participant_status AS ENUM (
    'pending',
    'rejected', 
    'approved',
    'this week',
    'next week',
    'next week on site',
    'past week'
);

-- Add status column to weekly_contest_participants table
ALTER TABLE weekly_contest_participants 
ADD COLUMN participant_status participant_status DEFAULT 'this week';

-- Create index for better filtering performance
CREATE INDEX idx_weekly_contest_participants_status ON weekly_contest_participants(participant_status);

-- Update existing records based on admin_status
UPDATE weekly_contest_participants 
SET participant_status = CASE 
    WHEN admin_status = 'pending' THEN 'pending'::participant_status
    WHEN admin_status = 'approved' THEN 'approved'::participant_status
    WHEN admin_status = 'rejected' THEN 'rejected'::participant_status
    WHEN admin_status = 'this week' THEN 'this week'::participant_status
    WHEN admin_status = 'next week' THEN 'next week'::participant_status
    WHEN admin_status LIKE 'past week%' THEN 'past week'::participant_status
    ELSE 'this week'::participant_status
END;