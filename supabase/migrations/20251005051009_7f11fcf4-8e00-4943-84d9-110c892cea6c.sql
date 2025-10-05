
-- Remove final_rank from Charmel Cabiles
UPDATE weekly_contest_participants
SET final_rank = NULL
WHERE admin_status = 'this week' 
  AND application_data->>'first_name' ILIKE '%Charmel%'
  AND application_data->>'last_name' ILIKE '%Cabiles%';
