-- Создаем простого фиктивного пользователя для тестовых участников
INSERT INTO auth.users (
  id, 
  email, 
  created_at, 
  updated_at,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test.contestant@example.com',
  now(),
  now(),
  now(),
  '{"first_name": "Test", "last_name": "Contestant"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Теперь обновляем участника конкурса
UPDATE weekly_contest_participants 
SET user_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE id = 'c9ca109e-04e9-41bf-b04b-68a915d70dde';

-- И обновляем заявку на конкурс
UPDATE contest_applications 
SET user_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE user_id = '1b5c2751-a820-4767-87e6-d06080219942' 
  AND application_data->>'first_name' = 'rima' 
  AND application_data->>'last_name' = 'vilo';