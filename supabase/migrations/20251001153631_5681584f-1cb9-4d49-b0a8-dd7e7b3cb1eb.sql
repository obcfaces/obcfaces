
-- Remove duplicate card with less activity
-- Keep: abedd7b7-fa9e-4081-996e-893f3a9d7e90 (9 ratings)
-- Delete: d592f588-957d-4195-93c4-20d5bab7f24a (4 ratings)

UPDATE weekly_contest_participants
SET is_active = false
WHERE id = 'd592f588-957d-4195-93c4-20d5bab7f24a';
