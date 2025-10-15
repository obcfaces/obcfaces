import { useEffect, useState } from 'react';
import { getCardTotalsMap } from '@/services/weeklyContest';
import { getNextWeekParticipants } from '@/data/participants';
import { captureError } from '@/utils/errors';

export function useNextWeekCards() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setLoading(true);
      const [parts, totals] = await Promise.all([
        getNextWeekParticipants(),
        getCardTotalsMap(),
      ]);

      const enriched = parts
        .map((p) => {
          const agg = totals.get(p.user_id);
          return {
            ...p,
            likes: agg?.total_likes ?? 0,
            dislikes: agg?.total_dislikes ?? 0,
            totalVotes: agg?.total_votes ?? 0,
            displayName: agg?.candidate_name ?? '',
          };
        })
        .sort((a, b) => (b.totalVotes ?? 0) - (a.totalVotes ?? 0));

      setCards(enriched);
    } catch (error) {
      captureError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { cards, loading, refresh };
}
