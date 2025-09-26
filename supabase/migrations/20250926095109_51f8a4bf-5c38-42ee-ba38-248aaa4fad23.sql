-- Update admin_status to 'this week' for Rona Marie Real and Lucy Cutamora to make them appear in "This Week" section on the main site
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE id IN ('580ed41d-46f5-436d-b43a-ac305d79808e', '715e9da2-63a2-4cb8-94d2-f3e7ed0a2806');