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
    weekInterval?: string
  ) => {
    try {
      setLoading(true);
      
      const statusArray = Array.isArray(adminStatus) ? adminStatus : [adminStatus];
      
      let query = supabase
        .from('weekly_contest_participants')
        .select('*')
        .in('admin_status', statusArray as any)
        .eq('is_active', true)
        .is('deleted_at', null);
      
      if (weekInterval) {
        query = query.eq('week_interval', weekInterval);
      }
      
      const { data: participants, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading participants:', error);
        return [];
      }

      if (!participants || participants.length === 0) {
        return [];
      }

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
