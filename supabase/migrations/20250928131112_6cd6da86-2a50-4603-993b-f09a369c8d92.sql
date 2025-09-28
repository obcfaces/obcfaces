-- Fill rating history with existing data
INSERT INTO public.contestant_rating_history (
  rating_id,
  user_id,
  contestant_user_id,
  participant_id,
  contestant_name,
  old_rating,
  new_rating,
  action_type,
  changed_at
)
SELECT 
  cr.id as rating_id,
  cr.user_id,
  cr.contestant_user_id,
  cr.participant_id,
  cr.contestant_name,
  NULL as old_rating, -- No old rating for existing data
  cr.rating as new_rating,
  'existing' as action_type, -- Mark as existing data
  cr.created_at as changed_at
FROM public.contestant_ratings cr
WHERE NOT EXISTS (
  -- Only insert if not already in history
  SELECT 1 FROM public.contestant_rating_history crh 
  WHERE crh.rating_id = cr.id
);