import { supabase } from './supabaseClient';
import type { Database } from '@/types/database';

type ParticipantRow = Database['public']['Tables']['weekly_contest_participants']['Row'];

/**
 * Get next week participants
 */
export async function getNextWeekParticipants(): Promise<ParticipantRow[]> {
  const { data, error } = await supabase
    .from('weekly_contest_participants')
    .select('*')
    .eq('admin_status', 'next week on site')
    .is('deleted_at', null);
  
  if (error) throw error;
  return data || [];
}

/**
 * Get participants by status
 */
export async function getParticipantsByStatus(status: Database['public']['Tables']['weekly_contest_participants']['Row']['admin_status']): Promise<ParticipantRow[]> {
  const { data, error } = await supabase
    .from('weekly_contest_participants')
    .select('*')
    .eq('admin_status', status)
    .is('deleted_at', null);
  
  if (error) throw error;
  return data || [];
}
