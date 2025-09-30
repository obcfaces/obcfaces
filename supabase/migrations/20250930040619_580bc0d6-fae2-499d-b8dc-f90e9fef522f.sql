-- Fix Kate Bugwat's incorrect status from 'week-2025-09-23' to 'this week'
UPDATE public.weekly_contest_participants 
SET admin_status = 'this week' 
WHERE id = '37164b2d-8713-4349-bd97-c6ef56f1b950'
  AND admin_status = 'week-2025-09-23';