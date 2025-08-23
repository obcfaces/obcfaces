-- Временно отключим RLS для диагностики проблемы
-- И создадим более простые политики

-- Удаляем все текущие политики
DROP POLICY IF EXISTS "Admin users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can delete roles" ON public.user_roles;

-- Временно разрешаем админу с конкретным ID управлять ролями
-- Используем ID пользователя, который уже является админом: 1b5c2751-a820-4767-87e6-d06080219942

CREATE POLICY "Allow specific admin to manage roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() = '1b5c2751-a820-4767-87e6-d06080219942'::uuid)
WITH CHECK (auth.uid() = '1b5c2751-a820-4767-87e6-d06080219942'::uuid);