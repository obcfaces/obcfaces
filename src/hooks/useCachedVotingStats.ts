import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VotingStats {
  participant_id: string;
  contestant_user_id?: string;
  total_voters: number;
  average_rating: number;
  total_votes: number;
  last_vote_at: string;
  week_interval: string;
}

/**
 * Hook to fetch cached voting statistics with optimized performance
 */
export const useCachedVotingStats = (participantId?: string) => {
  return useQuery({
    queryKey: ['cached-voting-stats', participantId],
    queryFn: async () => {
      if (!participantId) return null;

      // First try to get from cached materialized view
      const { data: cachedData, error: cacheError } = await supabase
        .from('cached_voting_stats')
        .select('*')
        .eq('participant_id', participantId)
        .single();

      if (!cacheError && cachedData) {
        return cachedData as VotingStats;
      }

      // Fallback to real-time query if cache miss
      console.log('Cache miss, fetching real-time stats for:', participantId);
      
      const { data: liveData, error: liveError } = await supabase
        .from('contestant_ratings')
        .select('rating, user_id, created_at, week_interval')
        .eq('participant_id', participantId);

      if (liveError) throw liveError;

      if (!liveData || liveData.length === 0) {
        return {
          participant_id: participantId,
          total_voters: 0,
          average_rating: 0,
          total_votes: 0,
          last_vote_at: new Date().toISOString(),
          week_interval: '',
        };
      }

      // Calculate stats from live data
      const uniqueVoters = new Set(liveData.map(v => v.user_id)).size;
      const avgRating = liveData.reduce((sum, v) => sum + v.rating, 0) / liveData.length;
      const lastVote = liveData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        participant_id: participantId,
        total_voters: uniqueVoters,
        average_rating: Math.round(avgRating * 10) / 10,
        total_votes: liveData.length,
        last_vote_at: lastVote.created_at,
        week_interval: lastVote.week_interval || '',
      };
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    enabled: !!participantId,
  });
};

/**
 * Hook to fetch all cached voting stats for current week
 */
export const useWeekVotingStats = (weekInterval?: string) => {
  return useQuery({
    queryKey: ['week-voting-stats', weekInterval],
    queryFn: async () => {
      const query = supabase
        .from('cached_voting_stats')
        .select('*')
        .order('average_rating', { ascending: false });

      if (weekInterval) {
        query.eq('week_interval', weekInterval);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as VotingStats[];
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    enabled: true,
  });
};

/**
 * Hook to manually refresh voting stats cache
 */
export const useRefreshVotingCache = () => {
  return async (type: 'voting' | 'engagement' | 'all' = 'all') => {
    try {
      const { data, error } = await supabase.functions.invoke('cache-refresh', {
        body: { type },
      });

      if (error) throw error;
      
      console.log('✅ Cache refreshed:', data);
      return data;
    } catch (error) {
      console.error('Error refreshing cache:', error);
      throw error;
    }
  };
};