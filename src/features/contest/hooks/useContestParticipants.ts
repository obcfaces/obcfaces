import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  photo_1_url: string | null;
  photo_2_url: string | null;
  avatar_url: string | null;
  age: number | null;
  city: string | null;
  country: string | null;
  height_cm: number | null;
  weight_kg: number | null;
}

export const useContestParticipants = () => {
  const [loading, setLoading] = useState(false);

  const fetchParticipantsByStatus = useCallback(async (
    adminStatus: string | string[],
    weekInterval?: string,
    countryCode?: string
  ) => {
    try {
      setLoading(true);
      
      console.log(`🔵 [PUBLIC] fetchParticipantsByStatus called:`, {
        adminStatus,
        weekInterval,
        countryCode
      });
      
      const statusArray = Array.isArray(adminStatus) ? adminStatus : [adminStatus];
      
      let query = supabase
        .from('weekly_contest_participants')
        .select('*')
        .in('admin_status', statusArray as any)
        .eq('is_active', true)
        .is('deleted_at', null);
      
      console.log(`🔵 [PUBLIC] Base query created for statuses:`, statusArray);
      
      if (weekInterval) {
        console.log(`🔵 [PUBLIC] Adding week_interval filter:`, weekInterval);
        query = query.eq('week_interval', weekInterval);
      }

      // Filter by country if provided
      if (countryCode) {
        const countryCode_upper = countryCode.toUpperCase();
        const countryNames: Record<string, string> = {
          'PH': 'Philippines',
          'KZ': 'Kazakhstan',
          'RU': 'Russia',
          'UA': 'Ukraine',
        };
        const countryName = countryNames[countryCode_upper];
        
        console.log(`🔵 [PUBLIC] Adding country filter:`, { countryCode, countryName });
        
        if (countryName) {
          query = query.or(`application_data->>country.eq.${countryCode_upper},application_data->>country.eq.${countryName}`);
        } else {
          query = query.filter('application_data->>country', 'eq', countryCode);
        }
      }
      
      const { data: participants, error } = await query.order('created_at', { ascending: false });

      console.log(`🔵 [PUBLIC] Query result:`, {
        participantsCount: participants?.length || 0,
        error: error?.message
      });

      if (error) {
        console.error('Error loading participants:', error);
        return [];
      }

      if (!participants || participants.length === 0) {
        console.log(`🔵 [PUBLIC] No participants found`);
        return [];
      }

      console.log(`🔵 [PUBLIC] Sample participant data:`, participants.slice(0, 3).map(p => {
        const appData = p.application_data as any;
        return {
          name: `${appData?.first_name || ''} ${appData?.last_name || ''}`,
          status: p.admin_status,
          week_interval: p.week_interval,
          country: appData?.country
        };
      }));

      const userIds = participants.map(p => p.user_id);
      const { data: profilesData } = await (supabase.rpc as any)(
        'get_public_contest_participant_photos', 
        { participant_user_ids: userIds }
      );
      
      const profiles = (profilesData || []) as Profile[];

      const participantsWithProfiles = participants.map(participant => ({
        ...participant,
        profiles: profiles?.find(p => p.id === participant.user_id) || null
      }));

      return participantsWithProfiles || [];
    } catch (error) {
      console.error('Error loading participants:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserRatingsForParticipants = useCallback(async (
    participants: any[], 
    userId: string
  ) => {
    if (!userId || !participants || participants.length === 0) {
      return {};
    }
    
    const participantIds = participants
      .map(p => p.id)
      .filter(id => id && id !== '00000000-0000-0000-0000-000000000000');
    
    if (participantIds.length === 0) {
      return {};
    }
    
    try {
      const { data: ratings, error } = await supabase
        .from('contestant_ratings')
        .select('participant_id, rating')
        .eq('user_id', userId)
        .in('participant_id', participantIds);
      
      if (error) {
        console.error('Error loading user ratings:', error);
        return {};
      }
      
      const ratingsMap: Record<string, number> = {};
      ratings?.forEach(r => {
        if (r.participant_id) {
          ratingsMap[r.participant_id] = r.rating;
        }
      });
      
      return ratingsMap;
    } catch (error) {
      console.error('Error loading user ratings:', error);
      return {};
    }
  }, []);

  return {
    loading,
    fetchParticipantsByStatus,
    loadUserRatingsForParticipants,
  };
};
