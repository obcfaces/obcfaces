-- Remove the "this week" duplicate for Lucy Cutamora, keep only the "pending" one
DELETE FROM weekly_contest_participants 
WHERE id = 'f4253973-a490-4ac5-ac5e-d7393acd521f' 
  AND admin_status = 'this week' 
  AND user_id = 'd297fbe0-611f-4bb6-995e-3749a01f1468';