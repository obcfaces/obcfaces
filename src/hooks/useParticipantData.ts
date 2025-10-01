import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ParticipantData {
  participant_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  country: string;
  state?: string;
  city: string;
  height_cm: number;
  weight_kg: number;
  photo_1_url: string;
  photo_2_url: string;
  average_rating: number;
  total_votes: number;
  final_rank: number;
  created_at: string;
  display_name?: string;
  // Admin-only fields
  contest_id?: string;
  avatar_url?: string;
  gender?: string;
  marital_status?: string;
  has_children?: boolean;
  participant_type?: string;
  contest_start_date?: string;
  contest_end_date?: string;
  contest_title?: string;
  contest_status?: string;
  application_data?: any;
  phone_data?: any;
  application_status?: string;
  is_active?: boolean;
  admin_status?: string;
}

export const useParticipantData = (participantName?: string, userId?: string) => {
  const [data, setData] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        setIsAdmin(roles?.role === 'admin');
      }
    };
    checkAdminStatus();
  }, []);

  useEffect(() => {
    const loadParticipantData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use admin RPC if user is admin, otherwise use public RPC
        const rpcFunction = isAdmin 
          ? 'get_weekly_contest_participants_admin' 
          : 'get_weekly_contest_participants_public';
        
        const { data: participants, error } = await supabase
          .rpc(rpcFunction, { weeks_offset: 0 });

        if (error) {
          console.error('Error loading participants:', error);
          setError(error.message);
          return;
        }

        if (participants) {
          // Map data to match ParticipantData interface
          const mappedData = participants.map((p: any) => ({
            ...p,
            participant_id: p.participant_id || p.id,
            photo_1_url: p.photo_1_url || p.photo1_url,
            photo_2_url: p.photo_2_url || p.photo2_url,
            created_at: p.created_at || new Date().toISOString(),
          }));

          // If looking for specific participant, filter by name
          if (participantName) {
            const normalizedSearchName = participantName.trim().toLowerCase();
            const filtered = mappedData.filter((p: any) => {
              const fullName = `${p.first_name} ${p.last_name}`.trim().toLowerCase();
              const displayName = p.display_name?.toLowerCase() || '';
              return fullName === normalizedSearchName || displayName === normalizedSearchName;
            });
            setData(filtered);
          } else if (userId) {
            // If looking for specific user
            const filtered = mappedData.filter((p: any) => p.user_id === userId);
            setData(filtered);
          } else {
            // Return all participants
            setData(mappedData);
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

    // Set up real-time subscription for weekly contest participants changes
    const subscription = supabase
      .channel('weekly_contest_participants_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'weekly_contest_participants' 
        }, 
        () => {
          console.log('Weekly contest participants changed, refreshing data...');
          loadParticipantData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
    refresh: async () => {
      setLoading(true);
      setError(null);
      
      try {
        const rpcFunction = isAdmin 
          ? 'get_weekly_contest_participants_admin' 
          : 'get_weekly_contest_participants_public';
        
        const { data: participants, error } = await supabase
          .rpc(rpcFunction, { weeks_offset: 0 });

        if (error) {
          console.error('Error loading participants:', error);
          setError(error.message);
          return;
        }

        if (participants) {
          // Map data to match ParticipantData interface
          const mappedData = participants.map((p: any) => ({
            ...p,
            participant_id: p.participant_id || p.id,
            photo_1_url: p.photo_1_url || p.photo1_url,
            photo_2_url: p.photo_2_url || p.photo2_url,
            created_at: p.created_at || new Date().toISOString(),
          }));

          if (participantName) {
            const normalizedSearchName = participantName.trim().toLowerCase();
            const filtered = mappedData.filter((p: any) => {
              const fullName = `${p.first_name} ${p.last_name}`.trim().toLowerCase();
              const displayName = p.display_name?.toLowerCase() || '';
              return fullName === normalizedSearchName || displayName === normalizedSearchName;
            });
            setData(filtered);
          } else if (userId) {
            const filtered = mappedData.filter((p: any) => p.user_id === userId);
            setData(filtered);
          } else {
            setData(mappedData);
          }
        }
      } catch (error) {
        console.error('Error refreshing participant data:', error);
        setError('Failed to refresh participant data');
      } finally {
        setLoading(false);
      }
    }
  };
};