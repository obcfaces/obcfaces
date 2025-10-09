import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WeeklyContestParticipant {
  id: string;
  contest_id: string;
  user_id: string;
  application_data?: any;
  final_rank: number | null;
  total_votes?: number;
  average_rating?: number;
  created_at?: string;
  submitted_at?: string;
  contest_start_date?: string;
  is_active: boolean;
  admin_status?: string;
  participant_status?: string;
  deleted_at?: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
    age: number;
    city: string;
    country: string;
    photo_1_url: string;
    photo_2_url: string;
    height_cm: number;
    weight_kg: number;
  } | null;
  status_history?: any;
  week_interval?: string;
}

export const useAdminParticipants = () => {
  const [weeklyParticipants, setWeeklyParticipants] = useState<WeeklyContestParticipant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWeeklyParticipants = useCallback(async (weekOffset: number = 0) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_weekly_contest_participants_admin', { weeks_offset: weekOffset });

      if (error) throw error;
      setWeeklyParticipants((data as any) || []);
    } catch (error) {
      console.error('Error fetching weekly participants:', error);
      setWeeklyParticipants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateParticipantStatus = useCallback(async (
    participantId: string,
    newStatus: string,
    userId: string
  ) => {
    const { error } = await supabase
      .from('weekly_contest_participants')
      .update({
        admin_status: newStatus as any,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', participantId);

    if (error) throw error;
  }, []);

  const deleteParticipant = useCallback(async (participantId: string) => {
    const { error } = await supabase
      .from('weekly_contest_participants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', participantId);

    if (error) throw error;
  }, []);

  return {
    weeklyParticipants,
    loading,
    fetchWeeklyParticipants,
    updateParticipantStatus,
    deleteParticipant
  };
};
