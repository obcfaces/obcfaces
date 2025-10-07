-- Add 'regular' role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'regular';

-- Assign 'regular' role to users who voted in 2+ week intervals
-- These are the 28 users with unique_weeks_count >= 2
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'regular'::app_role
FROM public.user_voting_stats
WHERE unique_weeks_count >= 2
ON CONFLICT (user_id, role) DO NOTHING;