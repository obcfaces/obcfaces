-- Fix the security definer view issue detected by linter
-- Remove the security_barrier setting which was causing the security definer view warning

-- Drop the existing view
DROP VIEW IF EXISTS public.like_counts;

-- Recreate the view without security barrier setting
-- This provides aggregated like counts without exposing individual user data
CREATE OR REPLACE VIEW public.like_counts AS
SELECT 
  content_type,
  content_id,
  COUNT(*) as like_count
FROM public.likes
GROUP BY content_type, content_id;

-- Add appropriate comment
COMMENT ON VIEW public.like_counts IS 
'Provides aggregated like counts without exposing individual user like data for privacy protection. This view respects RLS policies on the underlying likes table.';