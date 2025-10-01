-- Add new application-status values to admin_status for weekly_contest_participants
-- This preserves existing data and allows contest applications to be tracked with their original status

-- Get the current active contest_id
DO $$
DECLARE
  current_contest_id UUID;
BEGIN
  -- Get the most recent active contest
  SELECT id INTO current_contest_id
  FROM weekly_contests
  WHERE status = 'active'
  ORDER BY week_start_date DESC
  LIMIT 1;

  -- If no active contest, get the most recent one
  IF current_contest_id IS NULL THEN
    SELECT id INTO current_contest_id
    FROM weekly_contests
    ORDER BY week_start_date DESC
    LIMIT 1;
  END IF;

  -- Insert all contest applications that don't have weekly_contest_participants records
  -- Use their original application status as admin_status
  INSERT INTO weekly_contest_participants (
    contest_id,
    user_id,
    application_data,
    admin_status,
    is_active,
    created_at
  )
  SELECT 
    current_contest_id,
    ca.user_id,
    ca.application_data,
    ca.status, -- Use application status as admin_status
    ca.is_active,
    ca.created_at
  FROM contest_applications ca
  WHERE ca.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM weekly_contest_participants wcp 
      WHERE wcp.user_id = ca.user_id
    )
  ON CONFLICT (user_id, contest_id) DO NOTHING;

  RAISE NOTICE 'Transferred application statuses to admin_status. Contest ID: %', current_contest_id;
END $$;