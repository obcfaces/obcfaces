-- Remove the overly permissive policy that allows public access to all user roles
DROP POLICY IF EXISTS "Allow role checking" ON public.user_roles;

-- The has_role() function uses SECURITY DEFINER so it can still access the table
-- Users can still view their own roles through the existing "Users can view own roles" policy
-- This fixes the security vulnerability while maintaining functionality