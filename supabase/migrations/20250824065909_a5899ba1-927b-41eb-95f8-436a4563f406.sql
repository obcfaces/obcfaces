-- Add admin role for denisvisionary@gmail.com
-- First, get the user ID for the email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'denisvisionary@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;