-- Включаем realtime для таблицы messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Добавляем таблицу messages в realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Включаем realtime для таблицы conversation_participants (для обновления last_read_at)
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;

-- Добавляем таблицу conversation_participants в realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;