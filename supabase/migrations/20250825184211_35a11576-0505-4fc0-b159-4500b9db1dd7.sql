-- Просто обновляем user_id участника на null, 
-- чтобы данные были видны всем пользователям
UPDATE weekly_contest_participants 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE id = 'c9ca109e-04e9-41bf-b04b-68a915d70dde';

-- Также обновляем связанную заявку
UPDATE contest_applications 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE user_id = '1b5c2751-a820-4767-87e6-d06080219942' 
  AND application_data->>'first_name' = 'rima' 
  AND application_data->>'last_name' = 'vilo';