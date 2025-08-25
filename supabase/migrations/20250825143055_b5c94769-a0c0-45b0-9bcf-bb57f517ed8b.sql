-- Remove Ayala Laguna from current week by name
DELETE FROM public.weekly_contest_participants 
WHERE contest_id = (
  SELECT id FROM public.weekly_contests 
  WHERE status = 'active' 
  AND week_start_date = get_week_monday(CURRENT_DATE::date)
)
AND (
  (application_data->>'first_name' = 'Ayala' AND application_data->>'last_name' = 'Laguna')
  OR user_id = (
    SELECT user_id FROM public.profiles 
    WHERE (first_name = 'Ayala' AND last_name = 'Laguna') 
    OR display_name = 'Ayala Laguna'
    LIMIT 1
  )
);