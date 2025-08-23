import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ParticipantData {
  participant_id: string;
  user_id: string;
  contest_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  age: number;
  country: string;
  state: string;
  city: string;
  height_cm: number;
  weight_kg: number;
  gender: string;
  marital_status: string;
  has_children: boolean;
  photo_1_url: string;
  photo_2_url: string;
  avatar_url: string;
  participant_type: string;
  average_rating: number;
  total_votes: number;
  final_rank: number;
  contest_start_date: string;
  contest_end_date: string;
  contest_title: string;
  contest_status: string;
}

export const useParticipantData = (participantName?: string, userId?: string) => {
  const [data, setData] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadParticipantData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get current week's contest participants
        const { data: participants, error } = await supabase
          .rpc('get_weekly_contest_participants_public', { weeks_offset: 0 });

        if (error) {
          console.error('Error loading participants:', error);
          setError(error.message);
          return;
        }

        if (participants) {
          // If looking for specific participant, filter by name
          if (participantName) {
            const normalizedSearchName = participantName.trim().toLowerCase();
            const filtered = participants.filter((p: any) => {
              const fullName = `${p.first_name} ${p.last_name}`.trim().toLowerCase();
              const displayName = p.display_name?.toLowerCase() || '';
              return fullName === normalizedSearchName || displayName === normalizedSearchName;
            });
            setData(filtered);
          } else if (userId) {
            // If looking for specific user
            const filtered = participants.filter((p: any) => p.user_id === userId);
            setData(filtered);
          } else {
            // Return all participants
            setData(participants);
          }
        }
      } catch (error) {
        console.error('Error loading participant data:', error);
        setError('Failed to load participant data');
      } finally {
        setLoading(false);
      }
    };

    loadParticipantData();
  }, [participantName, userId]);

  const getParticipantByName = (name: string): ParticipantData | null => {
    const normalizedName = name.trim().toLowerCase();
    return data.find(p => {
      const fullName = `${p.first_name} ${p.last_name}`.trim().toLowerCase();
      const displayName = p.display_name?.toLowerCase() || '';
      return fullName === normalizedName || displayName === normalizedName;
    }) || null;
  };

  const getParticipantById = (id: string): ParticipantData | null => {
    return data.find(p => p.user_id === id) || null;
  };

  return { 
    data, 
    loading, 
    error, 
    getParticipantByName, 
    getParticipantById,
    refresh: () => {
      const loadParticipantData = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const { data: participants, error } = await supabase
            .rpc('get_weekly_contest_participants_public', { weeks_offset: 0 });

          if (error) {
            console.error('Error loading participants:', error);
            setError(error.message);
            return;
          }

          if (participants) {
            if (participantName) {
              const normalizedSearchName = participantName.trim().toLowerCase();
              const filtered = participants.filter((p: any) => {
                const fullName = `${p.first_name} ${p.last_name}`.trim().toLowerCase();
                const displayName = p.display_name?.toLowerCase() || '';
                return fullName === normalizedSearchName || displayName === normalizedSearchName;
              });
              setData(filtered);
            } else if (userId) {
              const filtered = participants.filter((p: any) => p.user_id === userId);
              setData(filtered);
            } else {
              setData(participants);
            }
          }
        } catch (error) {
          console.error('Error refreshing participant data:', error);
          setError('Failed to refresh participant data');
        } finally {
          setLoading(false);
        }
      };

      loadParticipantData();
    }
  };
};