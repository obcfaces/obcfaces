-- Remove Ayala Laguna from current week since she already participated last week
DELETE FROM public.weekly_contest_participants 
WHERE contest_id = (
  SELECT id FROM public.weekly_contests 
  WHERE status = 'active' 
  AND week_start_date = get_week_monday(CURRENT_DATE::date)
)
AND user_id = (
  SELECT wcp.user_id FROM public.weekly_contest_participants wcp
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday((CURRENT_DATE - INTERVAL '7 days')::date)
  AND wcp.final_rank = 1  -- She was the winner last week
  LIMIT 1
);