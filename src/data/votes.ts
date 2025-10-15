import { supabase } from './supabaseClient';
import type { Database } from '@/types/database';

export type DayAgg = {
  participant_user_id: string;
  candidate_name: string;
  vote_date: string;
  likes: number;
  dislikes: number;
  total_votes: number;
};

export type CardTotals = {
  participant_user_id: string;
  candidate_name: string;
  total_likes: number;
  total_dislikes: number;
  total_votes: number;
};

/**
 * Get votes aggregated by day from the view
 */
export async function getVotesByDay(): Promise<DayAgg[]> {
  const { data, error } = await supabase
    .from('v_next_week_votes_by_day')
    .select('*');
  
  if (error) throw error;
  return data as DayAgg[];
}

/**
 * Get card totals for next week participants
 */
export async function getNextWeekCardTotals(): Promise<CardTotals[]> {
  const { data, error } = await supabase
    .from('v_next_week_cards_totals')
    .select('*')
    .order('total_votes', { ascending: false });
  
  if (error) throw error;
  return data as CardTotals[];
}

/**
 * Call RPC for weekly votes summary (if function exists)
 * Note: This function may need to be created in the database
 */
export async function rpcWeeklySummary(weekStartISO: string) {
  // For now, return empty array as RPC may not exist
  // TODO: Implement get_weekly_votes_summary RPC if needed
  return [];
}
