-- Fix Critical Security Issues (Corrected)

-- 1. Restrict user_voting_stats table - only admins and user themselves
DROP POLICY IF EXISTS "Public can view voting stats" ON public.user_voting_stats;

CREATE POLICY "Users can view only own voting stats"
ON public.user_voting_stats
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Restrict likes table - users can only see their own likes  
DROP POLICY IF EXISTS "Public can view likes" ON public.likes;

CREATE POLICY "Users view own likes only"
ON public.likes
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Restrict shares table
DROP POLICY IF EXISTS "Users can view all shares" ON public.shares;

CREATE POLICY "Users view own shares only"
ON public.shares
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Add index for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_user_voting_stats_user_id 
ON user_voting_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_id 
ON likes(user_id);

CREATE INDEX IF NOT EXISTS idx_shares_user_id 
ON shares(user_id);