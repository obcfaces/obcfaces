-- Remove unused 'approved' and 'under_review' statuses from the system
-- These statuses are not used in the current workflow

-- First, verify there are no records with these statuses (should be 0)
DO $$ 
DECLARE 
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count
  FROM weekly_contest_participants 
  WHERE admin_status IN ('approved', 'under_review');
  
  IF record_count > 0 THEN
    RAISE EXCEPTION 'Cannot remove statuses - found % records using them', record_count;
  END IF;
  
  RAISE NOTICE 'Verified: No records using approved or under_review statuses';
END $$;

-- Update RLS policy to remove references to these statuses
DROP POLICY IF EXISTS "Users can update their own pending records" ON weekly_contest_participants;

CREATE POLICY "Users can update their own pending records" 
ON weekly_contest_participants 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND admin_status IN ('pending', 'rejected')
)
WITH CHECK (
  auth.uid() = user_id
);

-- Note: We cannot directly remove enum values in PostgreSQL without recreating the enum
-- Instead, we document that these values are deprecated and should not be used
COMMENT ON TYPE participant_admin_status IS 
'Participant status enum. Active values: pending, rejected, pre next week, this week, next week, next week on site, past. Deprecated (do not use): approved, under_review';

-- Log the change
DO $$ 
BEGIN
  RAISE NOTICE 'Successfully updated RLS policies to exclude approved and under_review statuses';
  RAISE NOTICE 'These statuses remain in the enum but are marked as deprecated';
END $$;