-- Fix security issues: Restrict public access to sensitive personal data
-- Issue 1: weekly_contest_participants contains sensitive application_data
-- Issue 2: contestant_ratings exposes individual user voting data

-- Drop the public access policy from weekly_contest_participants
DROP POLICY IF EXISTS "Anon and authenticated can view active participants" ON public.weekly_contest_participants;

-- Drop overly permissive policies from contestant_ratings
DROP POLICY IF EXISTS "Public can view contestant ratings statistics" ON public.contestant_ratings;
DROP POLICY IF EXISTS "Contest participants can view aggregate ratings" ON public.contestant_ratings;

-- Ensure only admins/moderators and users viewing their own data can access weekly_contest_participants
-- The public will only access data through the secure RPC function get_weekly_contest_participants_public

-- Ensure only admins/moderators and users viewing their own ratings can access contestant_ratings
-- Public access to aggregate statistics will be through secure RPC functions only

-- Verify that the secure RPC function get_weekly_contest_participants_public exists and is properly restricted
-- This function should only return safe, public-facing data without sensitive details

COMMENT ON TABLE public.weekly_contest_participants IS 'Contains sensitive personal data. Public access restricted to secure RPC functions only.';
COMMENT ON TABLE public.contestant_ratings IS 'Contains individual user voting data. Public access restricted to aggregate statistics through secure RPC functions only.';