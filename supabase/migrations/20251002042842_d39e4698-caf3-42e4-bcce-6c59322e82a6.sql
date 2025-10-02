-- Migrate data from contest_applications to weekly_contest_participants
-- Taking only the latest application per user
DO $$
DECLARE
  current_contest_id UUID;
  current_monday DATE;
BEGIN
  current_monday := get_week_monday(CURRENT_DATE);
  
  -- Get or create current week contest
  SELECT id INTO current_contest_id 
  FROM weekly_contests 
  WHERE week_start_date = current_monday;
  
  IF current_contest_id IS NULL THEN
    current_contest_id := create_weekly_contest(CURRENT_DATE);
  END IF;
  
  -- Migrate latest applications for each user
  INSERT INTO weekly_contest_participants (
    contest_id,
    user_id,
    application_data,
    admin_status,
    is_active,
    submitted_at,
    reviewed_at,
    reviewed_by,
    notes,
    deleted_at
  )
  SELECT DISTINCT ON (ca.user_id)
    current_contest_id,
    ca.user_id,
    ca.application_data,
    -- Map old status to admin_status
    CASE 
      WHEN ca.status = 'pending' THEN 'pending'::participant_admin_status
      WHEN ca.status = 'under_review' THEN 'under_review'::participant_admin_status
      WHEN ca.status = 'approved' THEN 'approved'::participant_admin_status
      WHEN ca.status = 'rejected' THEN 'rejected'::participant_admin_status
      ELSE 'pending'::participant_admin_status
    END,
    ca.is_active,
    ca.submitted_at,
    ca.reviewed_at,
    ca.reviewed_by,
    ca.notes,
    ca.deleted_at
  FROM contest_applications ca
  WHERE NOT EXISTS (
    SELECT 1 FROM weekly_contest_participants wcp 
    WHERE wcp.user_id = ca.user_id 
    AND wcp.contest_id = current_contest_id
  )
  ORDER BY ca.user_id, ca.updated_at DESC, ca.created_at DESC;
    
  RAISE NOTICE 'Data migration completed: migrated % applications', (SELECT count(*) FROM contest_applications);
END $$;