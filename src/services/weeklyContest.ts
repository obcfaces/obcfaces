import { getVotesByDay, getNextWeekCardTotals } from '@/data/votes';

export type TableRow = {
  participant_user_id: string;
  name: string;
  Mon: [number, number];
  Tue: [number, number];
  Wed: [number, number];
  Thu: [number, number];
  Fri: [number, number];
  Sat: [number, number];
  Sun: [number, number];
  totalLikes: number;
  totalDislikes: number;
  totalVotes: number;
};

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Build weekly table with votes per day
 */
export async function buildWeeklyTable(): Promise<TableRow[]> {
  const daily = await getVotesByDay();
  const map = new Map<string, TableRow>();

  for (const r of daily) {
    const dow = DOW[new Date(r.vote_date + 'T00:00:00Z').getUTCDay()];
    const cur = map.get(r.participant_user_id) ?? {
      participant_user_id: r.participant_user_id,
      name: r.candidate_name,
      Mon: [0, 0],
      Tue: [0, 0],
      Wed: [0, 0],
      Thu: [0, 0],
      Fri: [0, 0],
      Sat: [0, 0],
      Sun: [0, 0],
      totalLikes: 0,
      totalDislikes: 0,
      totalVotes: 0,
    };

    const cell = cur[dow]; // [likes, dislikes]
    cell[0] += r.likes;
    cell[1] += r.dislikes;
    cur.totalLikes += r.likes;
    cur.totalDislikes += r.dislikes;
    cur.totalVotes += r.total_votes;
    cur.name = r.candidate_name;
    map.set(r.participant_user_id, cur);
  }

  return [...map.values()].sort(
    (a, b) => b.totalVotes - a.totalVotes || a.name.localeCompare(b.name)
  );
}

/**
 * Get card totals as a Map for quick lookup
 */
export async function getCardTotalsMap() {
  const totals = await getNextWeekCardTotals();
  const map = new Map<string, typeof totals[number]>();
  totals.forEach((t) => map.set(t.participant_user_id, t));
  return map;
}
