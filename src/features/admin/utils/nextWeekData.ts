import { supabase } from '@/integrations/supabase/client';

export type NextDayRow = {
  participant_user_id: string;
  candidate_name: string;
  vote_date: string; // YYYY-MM-DD (UTC date)
  likes: number;
  dislikes: number;
  total_votes: number;
};

export type NextTotalsRow = {
  participant_user_id: string;
  candidate_name: string;
  total_likes: number;
  total_dislikes: number;
  total_votes: number;
};

export type Top3Row = {
  participant_user_id: string;
  candidate_name: string;
  total_likes: number;
  total_dislikes: number;
  total_votes: number;
  rank_position: number;
};

export async function loadDailyByParticipant(): Promise<NextDayRow[]> {
  const { data, error } = await supabase
    .from('v_next_week_votes_by_day')
    .select('*');

  if (error) {
    console.error('loadDailyByParticipant error', error);
    return [];
  }
  return data as NextDayRow[];
}

export async function loadCardTotals(): Promise<Map<string, NextTotalsRow>> {
  const { data, error } = await supabase
    .from('v_next_week_cards_totals')
    .select('*')
    .order('total_votes', { ascending: false });

  if (error) {
    console.error('loadCardTotals error', error);
    return new Map();
  }
  const map = new Map<string, NextTotalsRow>();
  (data as NextTotalsRow[]).forEach((r) => map.set(r.participant_user_id, r));
  return map;
}

export async function loadTop3(): Promise<Map<string, number>> {
  // Используем прямой запрос к view вместо RPC
  const { data, error } = await supabase
    .from('v_next_week_cards_totals')
    .select('participant_user_id, total_votes, total_likes')
    .order('total_votes', { ascending: false })
    .order('total_likes', { ascending: false })
    .limit(3);

  if (error) {
    console.error('loadTop3 error', error);
    return new Map();
  }
  
  const rankMap = new Map<string, number>();
  (data || []).forEach((r, index) => rankMap.set(r.participant_user_id, index + 1));
  return rankMap;
}
