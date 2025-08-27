-- Address the materialized view security issue
-- The 'Security Definer View' error might be related to the participant_stats materialized view
-- being accessible via the API without proper access controls

-- Option 1: Remove the materialized view from the API schema if it's exposed
-- Check if the materialized view should be excluded from API access
REVOKE ALL ON public.participant_stats FROM anon, authenticated;

-- Option 2: Add proper RLS to the materialized view if it needs to remain accessible
ALTER TABLE public.participant_stats ENABLE ROW LEVEL SECURITY;

-- Create a policy for the materialized view that allows reading contest statistics
CREATE POLICY "Public contest statistics are viewable by everyone" 
ON public.participant_stats 
FOR SELECT 
USING (true);

-- Add comment explaining the security model
COMMENT ON MATERIALIZED VIEW public.participant_stats IS 
'Contains aggregated contest statistics. RLS enabled for API access control.';