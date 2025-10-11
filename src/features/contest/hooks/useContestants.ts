import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContestFilters {
  country?: string;
  gender?: string;
  category?: string;
  ageMin?: number;
  ageMax?: number;
}

export interface Contestant {
  participant_id: string;
  user_id: string;
  first_name: string;
  display_name: string;
  age: number;
  city: string;
  country: string;
  photo_1_url: string;
  photo_2_url: string;
  final_rank?: number;
  total_votes: number;
  average_rating: number;
  height_cm?: number;
  weight_kg?: number;
}

interface UseContestantsParams {
  countryCode: string;
  weekOffset: number;
  filters?: ContestFilters;
  enabled?: boolean;
}

export const useContestants = ({ 
  countryCode, 
  weekOffset, 
  filters = {},
  enabled = true 
}: UseContestantsParams) => {
  return useQuery({
    queryKey: ['contestants', countryCode, weekOffset, filters],
    queryFn: async () => {
      let query = supabase
        .from('weekly_contest_participants')
        .select(`
          id,
          user_id,
          application_data,
          final_rank,
          total_votes,
          average_rating,
          admin_status,
          week_interval,
          created_at
        `)
        .eq('is_active', true)
        .is('deleted_at', null);

      // Filter by week offset
      if (weekOffset === 0) {
        query = query.eq('admin_status', 'this week');
      } else if (weekOffset === 1) {
        query = query.eq('admin_status', 'next week');
      } else if (weekOffset < 0) {
        // For past weeks, we need to join with weekly_contests
        const { data: weekData } = await supabase
          .from('weekly_contests')
          .select('week_start_date')
          .order('week_start_date', { ascending: false })
          .limit(Math.abs(weekOffset))
          .throwOnError();
        
        if (weekData && weekData.length > 0) {
          const targetWeek = weekData[weekData.length - 1];
          // Get participants for this specific week
        }
      }

      // Apply filters
      if (filters.country) {
        query = query.filter('application_data->>country', 'eq', filters.country);
      }
      if (filters.gender) {
        query = query.filter('application_data->>gender', 'eq', filters.gender);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Transform data to Contestant format
      const contestants: Contestant[] = (data || []).map(item => {
        const appData = item.application_data as any;
        return {
          participant_id: item.id,
          user_id: item.user_id,
          first_name: appData.first_name || '',
          display_name: appData.display_name || appData.first_name || '',
          age: appData.age || 0,
          city: appData.city || '',
          country: appData.country || '',
          photo_1_url: appData.photo1_url || appData.photo_1_url || '',
          photo_2_url: appData.photo2_url || appData.photo_2_url || '',
          final_rank: item.final_rank,
          total_votes: item.total_votes || 0,
          average_rating: item.average_rating || 0,
          height_cm: appData.height_cm,
          weight_kg: appData.weight_kg,
        };
      });

      // Apply age filters if provided
      let filtered = contestants;
      if (filters.ageMin !== undefined) {
        filtered = filtered.filter(c => c.age >= filters.ageMin!);
      }
      if (filters.ageMax !== undefined) {
        filtered = filtered.filter(c => c.age <= filters.ageMax!);
      }

      return {
        total: filtered.length,
        items: filtered
      };
    },
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes (formerly cacheTime)
    enabled,
  });
};
