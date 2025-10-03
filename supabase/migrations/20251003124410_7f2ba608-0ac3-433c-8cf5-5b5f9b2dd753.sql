-- ============================================
-- FIX: Remove Email Field from Profiles Table
-- ============================================
-- Email addresses should ONLY be stored in auth.users, not in the public profiles table.
-- This prevents unauthorized access to email addresses through RLS policies.

-- Drop the email column from the profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Add comment explaining why email is not in profiles
COMMENT ON TABLE public.profiles IS 'User profile information. Email addresses are stored in auth.users only for security.';
