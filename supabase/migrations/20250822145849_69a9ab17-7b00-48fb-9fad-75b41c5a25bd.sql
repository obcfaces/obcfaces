-- Добавляем политику для просмотра профилей участников разговоров
CREATE POLICY "Users can view profiles of conversation participants"
ON public.profiles
FOR SELECT
USING (
  -- Разрешаем просмотр профиля если пользователь участвует в разговоре с владельцем профиля
  EXISTS (
    SELECT 1 
    FROM public.conversation_participants cp1
    JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid() 
      AND cp2.user_id = profiles.id
      AND cp1.user_id != cp2.user_id
  )
);