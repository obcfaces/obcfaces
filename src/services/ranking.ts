import { supabase } from '@/data/supabaseClient';

/**
 * Get user's weekly rank
 */
export async function getUserWeeklyRank(userId: string) {
  const { data, error } = await supabase
    .from('v_user_weekly_rank')
    .select('*')
    .eq('participant_user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data; // { rank_position, total_votes, display_name_generated }
}
