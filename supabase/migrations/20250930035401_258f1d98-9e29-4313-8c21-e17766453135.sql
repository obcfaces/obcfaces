-- Consolidate past week statuses into single 'past' status
-- Update all 'past week 1', 'past week 2', 'past week 3' to 'past'

UPDATE public.weekly_contest_participants 
SET admin_status = 'past' 
WHERE admin_status IN ('past week 1', 'past week 2', 'past week 3');