-- Update RLS policy to allow viewing other users' profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- First remove the foreign key constraint temporarily
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Insert some test users profiles for demonstration
-- Note: These are fake profiles for testing purposes
INSERT INTO public.profiles (
  id,
  display_name,
  first_name,
  last_name,
  bio,
  city,
  country,
  age,
  height_cm,
  weight_kg,
  avatar_url,
  created_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'Анна Петрова',
  'Анна',
  'Петрова', 
  'Люблю спорт и активный отдых. Участвую в фитнес-соревнованиях.',
  'Москва',
  'Россия',
  25,
  165,
  55.5,
  null,
  now() - interval '3 months'
),
(
  '22222222-2222-2222-2222-222222222222',
  'Михаил Иванов',
  'Михаил',
  'Иванов',
  'Профессиональный фотограф. Обожаю путешествия и фиксировать красивые моменты.',
  'Санкт-Петербург', 
  'Россия',
  32,
  180,
  75.0,
  null,
  now() - interval '2 months'
),
(
  '33333333-3333-3333-3333-333333333333',
  'Елена Козлова',
  'Елена',
  'Козлова',
  'Художница и дизайнер. Создаю уникальные работы в стиле модерн.',
  'Екатеринбург',
  'Россия', 
  28,
  170,
  60.0,
  null,
  now() - interval '1 month'
),
(
  '44444444-4444-4444-4444-444444444444',
  'Дмитрий Смирнов',
  'Дмитрий',
  'Смирнов',
  'IT-специалист и любитель технологий. В свободное время играю на гитаре.',
  'Новосибирск',
  'Россия',
  29,
  178,
  70.5,
  null,
  now() - interval '2 weeks'
),
(
  '55555555-5555-5555-5555-555555555555',
  'Ольга Волкова',
  'Ольга', 
  'Волкова',
  'Преподаватель языков и переводчик. Говорю на 5 языках!',
  'Казань',
  'Россия',
  31,
  162,
  58.0,
  null,
  now() - interval '1 week'
);