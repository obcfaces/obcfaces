-- Fix remaining security issues: Update functions with missing search_path

-- Update get_or_create_conversation function
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    conversation_id UUID;
BEGIN
    -- Try to find existing conversation between these two users
    SELECT c.id INTO conversation_id
    FROM public.conversations c
    WHERE EXISTS (
        SELECT 1 FROM public.conversation_participants cp1 
        WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
        SELECT 1 FROM public.conversation_participants cp2 
        WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
    )
    AND (
        SELECT COUNT(*) FROM public.conversation_participants cp3 
        WHERE cp3.conversation_id = c.id
    ) = 2
    LIMIT 1;
    
    -- If no conversation exists, create one
    IF conversation_id IS NULL THEN
        INSERT INTO public.conversations DEFAULT VALUES
        RETURNING id INTO conversation_id;
        
        -- Add both participants
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (conversation_id, user1_id), (conversation_id, user2_id);
    END IF;
    
    RETURN conversation_id;
END;
$function$;

-- Update handle_new_user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (
    id, display_name, avatar_url,
    first_name, last_name, country, city, age, gender
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', null),
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    coalesce(new.raw_user_meta_data->>'first_name', null),
    coalesce(new.raw_user_meta_data->>'last_name', null),
    coalesce(new.raw_user_meta_data->>'country', null),
    coalesce(new.raw_user_meta_data->>'city', null),
    nullif(new.raw_user_meta_data->>'age', '')::int,
    coalesce(new.raw_user_meta_data->>'gender', null)
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    country = excluded.country,
    city = excluded.city,
    age = excluded.age,
    gender = excluded.gender;
  return new;
end;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;