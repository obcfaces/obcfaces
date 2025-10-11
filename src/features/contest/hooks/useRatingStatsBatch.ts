import { useQuery } from '@tanstack/react-query';
import { ParticipantsService } from '@/services/ParticipantsService';
import { useMemo } from 'react';
import type { RatingStat } from '../types';

export const useRatingStatsBatch = (participantIds: string[]) => {
  const query = useQuery({
    queryKey: ['rating-stats-batch', participantIds.sort().join(',')],
    queryFn: () => ParticipantsService.getParticipantStatsBulk(participantIds),
    enabled: participantIds.length > 0,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
  });

  // Convert array to map for O(1) lookup
  const statsById = useMemo(() => {
    const map = new Map<string, RatingStat>();
    (query.data || []).forEach((stat) => {
      map.set(stat.participant_id, {
        participant_id: stat.participant_id,
        average_rating: stat.average_rating,
        total_votes: stat.total_votes,
      });
    });
    return map;
  }, [query.data]);

  return {
    ...query,
    statsById,
  };
};
