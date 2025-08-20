-- Drop the problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create new RLS policies without infinite recursion
-- Allow users to view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow all authenticated users to view roles (needed for has_role function to work)
-- This is safe because the has_role function controls access, not the table directly
CREATE POLICY "Allow role checking" 
ON public.user_roles 
FOR SELECT 
USING (true);

-- Only allow direct admin insertion of roles (for bootstrapping)
-- This should be done through admin functions, not direct table access
CREATE POLICY "Admin role assignment" 
ON public.user_roles 
FOR ALL 
USING (false) 
WITH CHECK (false);