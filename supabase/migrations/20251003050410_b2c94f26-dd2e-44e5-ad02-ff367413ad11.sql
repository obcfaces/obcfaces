-- Migration: Consolidate contest_applications into weekly_contest_participants
-- This migration preserves all data, likes, votes, and ratings

-- Step 1: Add missing columns to weekly_contest_participants if they don't exist
ALTER TABLE public.weekly_contest_participants 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Step 2: Migrate data from contest_applications to weekly_contest_participants
-- Only insert records that don't already exist in weekly_contest_participants
INSERT INTO public.weekly_contest_participants (
  user_id,
  contest_id,
  application_data,
  submitted_at,
  reviewed_at,
  reviewed_by,
  notes,
  is_active,
  deleted_at,
  admin_status,
  status
)
SELECT 
  ca.user_id,
  -- Get or create current week contest
  COALESCE(
    (SELECT id FROM public.weekly_contests WHERE status = 'active' ORDER BY week_start_date DESC LIMIT 1),
    (SELECT create_weekly_contest())
  ) as contest_id,
  ca.application_data,
  ca.submitted_at,
  ca.reviewed_at,
  ca.reviewed_by,
  ca.notes,
  ca.is_active,
  ca.deleted_at,
  -- Map old status to admin_status
  CASE 
    WHEN ca.status = 'approved' THEN 'this week'::participant_admin_status
    WHEN ca.status = 'rejected' THEN 'rejected'::participant_admin_status
    WHEN ca.status = 'under_review' THEN 'under_review'::participant_admin_status
    ELSE 'pending'::participant_admin_status
  END as admin_status,
  ca.status
FROM public.contest_applications ca
WHERE NOT EXISTS (
  SELECT 1 FROM public.weekly_contest_participants wcp
  WHERE wcp.user_id = ca.user_id
)
ON CONFLICT (user_id, contest_id) DO NOTHING;

-- Step 3: Update contestant_ratings to reference participant_id where missing
UPDATE public.contestant_ratings cr
SET participant_id = wcp.id
FROM public.weekly_contest_participants wcp
WHERE cr.participant_id IS NULL
  AND cr.contestant_user_id = wcp.user_id;

-- Step 4: Update likes to reference participant_id where missing
-- Link likes to weekly_contest_participants by user match
WITH profile_matches AS (
  SELECT DISTINCT
    l.id as like_id,
    wcp.id as participant_id
  FROM public.likes l
  JOIN public.profiles p ON (
    l.content_id LIKE '%' || COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name)) || '%'
  )
  JOIN public.weekly_contest_participants wcp ON wcp.user_id = p.id
  WHERE l.participant_id IS NULL
    AND l.content_type = 'contest'
    AND l.content_id LIKE 'contestant-%'
)
UPDATE public.likes l
SET participant_id = pm.participant_id
FROM profile_matches pm
WHERE l.id = pm.like_id;

-- Step 5: Update photo_comments to reference participant_id where missing
WITH comment_matches AS (
  SELECT DISTINCT
    pc.id as comment_id,
    wcp.id as participant_id
  FROM public.photo_comments pc
  JOIN public.profiles p ON (
    pc.content_id LIKE '%' || COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name)) || '%'
  )
  JOIN public.weekly_contest_participants wcp ON wcp.user_id = p.id
  WHERE pc.participant_id IS NULL
    AND pc.content_type = 'contest'
    AND pc.content_id LIKE 'contestant-%'
)
UPDATE public.photo_comments pc
SET participant_id = cm.participant_id
FROM comment_matches cm
WHERE pc.id = cm.comment_id;

-- Step 6: Create backup view of contest_applications for reference
CREATE OR REPLACE VIEW public.contest_applications_backup AS
SELECT * FROM public.contest_applications;

-- Step 7: Log migration completion
DO $$
DECLARE
  migrated_count INTEGER;
  likes_updated INTEGER;
  ratings_updated INTEGER;
  comments_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count 
  FROM public.weekly_contest_participants 
  WHERE created_at >= NOW() - INTERVAL '1 minute';
  
  SELECT COUNT(*) INTO likes_updated
  FROM public.likes
  WHERE participant_id IS NOT NULL;
  
  SELECT COUNT(*) INTO ratings_updated
  FROM public.contestant_ratings
  WHERE participant_id IS NOT NULL;
  
  SELECT COUNT(*) INTO comments_updated
  FROM public.photo_comments
  WHERE participant_id IS NOT NULL;
  
  RAISE NOTICE 'Migration completed: % records migrated, % likes linked, % ratings linked, % comments linked', 
    migrated_count, likes_updated, ratings_updated, comments_updated;
END $$;