import React, { useMemo } from 'react';
import { ContestantCard } from './ContestCard';
import { useContestantsWithFilters } from '../hooks/useContestantsWithFilters';
import { useRatingStatsBatch } from '../hooks/useRatingStatsBatch';
import { VirtualizedList } from '@/components/performance/VirtualizedList';

interface ContestSectionOptimizedProps {
  title: string;
  subtitle: string;
  description?: string;
  weekOffset?: number;
  countryCode: string;
  viewMode?: 'compact' | 'full';
  filters?: React.ReactNode;
  enableVirtualization?: boolean;
}

export const ContestSectionOptimized = React.memo<ContestSectionOptimizedProps>(({
  title,
  subtitle,
  description,
  weekOffset = 0,
  countryCode,
  viewMode = 'compact',
  filters,
  enableVirtualization = false,
}) => {
  // Fetch contestants with URL filters applied
  const { data, isLoading } = useContestantsWithFilters({
    countryCode,
    weekOffset,
  });

  // Extract participant IDs
  const participantIds = useMemo(() => {
    return (data?.items || []).map(c => c.participant_id);
  }, [data]);

  // Batch load rating stats
  const { statsById, isLoading: statsLoading } = useRatingStatsBatch(participantIds);

  const contestants = useMemo(() => {
    if (!data?.items) return [];
    
    return data.items.map(contestant => ({
      ...contestant,
      stats: statsById.get(contestant.participant_id) || {
        total_votes: 0,
        average_rating: 0,
      },
    }));
  }, [data, statsById]);

  const shouldVirtualize = enableVirtualization && contestants.length > 50;

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm text-muted-foreground">Loading contestants...</div>
        </div>
      </div>
    );
  }

  if (contestants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No contestants found for this week.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {/* Filters */}
      {filters && <div className="pb-4">{filters}</div>}

      {/* Contestants Grid or Virtualized List */}
      {shouldVirtualize ? (
        <VirtualizedList
          items={contestants}
          itemHeight={viewMode === 'compact' ? 200 : 400}
          containerHeight={800}
          renderItem={(contestant, index) => {
            const stats = contestant.stats || { total_votes: 0, average_rating: 0 };
            return (
              <ContestantCard
                key={contestant.participant_id}
                rank={index + 1}
                name={contestant.display_name || contestant.first_name}
                country={contestant.country}
                city={contestant.city}
                age={contestant.age}
                weight={contestant.weight_kg || 0}
                height={contestant.height_cm || 0}
                rating={stats.average_rating}
                faceImage={contestant.photo_1_url}
                fullBodyImage={contestant.photo_2_url}
                viewMode={viewMode}
                profileId={contestant.participant_id}
                userId={contestant.user_id}
              />
            );
          }}
        />
      ) : (
        <div className={`grid gap-4 ${
          viewMode === 'compact' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {contestants.map((contestant, index) => {
            const stats = contestant.stats || { total_votes: 0, average_rating: 0 };
            return (
              <ContestantCard
                key={contestant.participant_id}
                rank={index + 1}
                name={contestant.display_name || contestant.first_name}
                country={contestant.country}
                city={contestant.city}
                age={contestant.age}
                weight={contestant.weight_kg || 0}
                height={contestant.height_cm || 0}
                rating={stats.average_rating}
                faceImage={contestant.photo_1_url}
                fullBodyImage={contestant.photo_2_url}
                viewMode={viewMode}
                profileId={contestant.participant_id}
                userId={contestant.user_id}
              />
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {contestants.length} contestant{contestants.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
});

ContestSectionOptimized.displayName = 'ContestSectionOptimized';
