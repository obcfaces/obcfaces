-- Удаляем старую блокирующую политику для user_roles
DROP POLICY IF EXISTS "Admin role assignment" ON public.user_roles;

-- Создаем правильные политики для управления ролями
-- Только админы могут добавлять роли
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Только админы могут обновлять роли
CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Только админы могут удалять роли
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));