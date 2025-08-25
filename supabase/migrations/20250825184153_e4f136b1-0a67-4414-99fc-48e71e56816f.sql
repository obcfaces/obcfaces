-- Создаем нового пользователя для участницы Rima Vilo
-- Сначала создаем профиль для нового пользователя
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  display_name,
  age,
  country,
  state,
  city,
  gender,
  height_cm,
  weight_kg,
  marital_status,
  has_children,
  photo_1_url,
  photo_2_url,
  avatar_url,
  is_approved,
  privacy_level,
  participant_type
) VALUES (
  gen_random_uuid(),
  'rima',
  'vilo',
  'rima vilo',
  23,
  'PH',
  'ALB',
  'Legazpi',
  'female',
  177,
  50,
  'single',
  false,
  'https://mlbzdxsumfudrtuuybqn.supabase.co/storage/v1/object/public/contest-photos/1b5c2751-a820-4767-87e6-d06080219942/photo1-1756125822757.png',
  'https://mlbzdxsumfudrtuuybqn.supabase.co/storage/v1/object/public/contest-photos/1b5c2751-a820-4767-87e6-d06080219942/photo2-1756119519707.png',
  'https://mlbzdxsumfudrtuuybqn.supabase.co/storage/v1/object/public/contest-photos/1b5c2751-a820-4767-87e6-d06080219942/photo1-1756058139611.png',
  true,
  'public',
  'candidate'
) 
ON CONFLICT (id) DO NOTHING;

-- Получаем ID созданного профиля
DO $$
DECLARE
  new_user_id UUID;
  current_contest_id UUID;
BEGIN
  -- Находим созданный профиль
  SELECT id INTO new_user_id FROM profiles WHERE first_name = 'rima' AND last_name = 'vilo' AND id != '1b5c2751-a820-4767-87e6-d06080219942' LIMIT 1;
  
  -- Получаем текущий активный конкурс
  SELECT id INTO current_contest_id FROM weekly_contests WHERE status = 'active' ORDER BY created_at DESC LIMIT 1;
  
  IF new_user_id IS NOT NULL AND current_contest_id IS NOT NULL THEN
    -- Создаем заявку на конкурс для нового пользователя
    INSERT INTO contest_applications (
      user_id,
      status,
      application_data,
      is_active
    ) VALUES (
      new_user_id,
      'approved',
      jsonb_build_object(
        'first_name', 'rima',
        'last_name', 'vilo',
        'birth_year', 2001,
        'birth_month', 1,
        'birth_day', 1,
        'country', 'PH',
        'state', 'ALB',
        'city', 'Legazpi',
        'gender', 'female',
        'height_cm', 177,
        'weight_kg', 50,
        'marital_status', 'single',
        'has_children', false,
        'photo1_url', 'https://mlbzdxsumfudrtuuybqn.supabase.co/storage/v1/object/public/contest-photos/1b5c2751-a820-4767-87e6-d06080219942/photo1-1756125822757.png',
        'photo2_url', 'https://mlbzdxsumfudrtuuybqn.supabase.co/storage/v1/object/public/contest-photos/1b5c2751-a820-4767-87e6-d06080219942/photo2-1756119519707.png'
      ),
      true
    );
    
    -- Обновляем участника конкурса на нового пользователя
    UPDATE weekly_contest_participants 
    SET user_id = new_user_id,
        application_data = jsonb_build_object(
          'first_name', 'rima',
          'last_name', 'vilo',
          'birth_year', 2001,
          'birth_month', 1,
          'birth_day', 1,
          'country', 'PH',
          'state', 'ALB',
          'city', 'Legazpi',
          'gender', 'female',
          'height_cm', 177,
          'weight_kg', 50,
          'marital_status', 'single',
          'has_children', false,
          'photo1_url', 'https://mlbzdxsumfudrtuuybqn.supabase.co/storage/v1/object/public/contest-photos/1b5c2751-a820-4767-87e6-d06080219942/photo1-1756125822757.png',
          'photo2_url', 'https://mlbzdxsumfudrtuuybqn.supabase.co/storage/v1/object/public/contest-photos/1b5c2751-a820-4767-87e6-d06080219942/photo2-1756119519707.png'
        )
    WHERE id = 'c9ca109e-04e9-41bf-b04b-68a915d70dde';
    
    RAISE NOTICE 'Created new user % and updated contest participant', new_user_id;
  END IF;
END $$;