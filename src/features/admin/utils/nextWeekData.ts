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
