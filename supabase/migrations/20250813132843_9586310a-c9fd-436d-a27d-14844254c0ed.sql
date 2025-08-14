-- Create a real user account for contestant
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token,
  email_change_token_current,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'maria.santos@gmail.com',
  '$2a$10$FQ.8a0u4QGO/Y8TJiUhGx.FQ8a0u4QGO/Y8TJiUhGx',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{
    "display_name": "Maria Santos",
    "first_name": "Maria",
    "last_name": "Santos",
    "country": "Philippines",
    "city": "Cebu",
    "age": 23
  }'
);

-- Create profile for the contestant
INSERT INTO public.profiles (
  id,
  display_name,
  first_name,
  last_name,
  country,
  city,
  age,
  height_cm,
  weight_kg,
  bio,
  avatar_url,
  gender,
  birthdate,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Maria Santos',
  'Maria',
  'Santos',
  'Philippines',
  'Cebu',
  23,
  168,
  52,
  'Участвую в конкурсе красоты. Люблю танцы и фотографию. Мечтаю о карьере модели.',
  null,
  'female',
  '2001-05-15',
  now(),
  now()
);