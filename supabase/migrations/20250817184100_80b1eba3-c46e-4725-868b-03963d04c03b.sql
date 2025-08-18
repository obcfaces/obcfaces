-- Get current user ID and assign admin role
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the first user ID from auth.users (assuming it's you)
    SELECT id INTO current_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    -- Insert admin role for this user (using upsert to avoid duplicates)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;