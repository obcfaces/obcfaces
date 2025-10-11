import { useMemo } from 'react';

/**
 * Общий хук для фильтрации участников по статусу и стране
 */
export const useStatusFilters = (
  participants: any[],
  statusFilter: string | string[],
  selectedCountry?: string
) => {
  return useMemo(() => {
    let filtered = participants;

    // Filter by status
    if (statusFilter) {
      const statusArray = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
      if (!statusArray.includes('all')) {
        filtered = filtered.filter(p => statusArray.includes(p.admin_status));
      }
    }

    // Filter by country
    if (selectedCountry) {
      filtered = filtered.filter(p => {
        const country = p.application_data?.country || p.profiles?.country;
        return country === selectedCountry;
      });
    }

    // Remove duplicates by user_id
    filtered = filtered.filter((participant, index, arr) => 
      arr.findIndex(p => p.user_id === participant.user_id) === index
    );

    return filtered;
  }, [participants, statusFilter, selectedCountry]);
};

/**
 * Хук для сортировки участников по рейтингу
 */
export const useSortedByRating = (participants: any[]) => {
  return useMemo(() => {
    return [...participants].sort((a, b) => {
      if (a.final_rank && !b.final_rank) return -1;
      if (!a.final_rank && b.final_rank) return 1;
      if (a.final_rank && b.final_rank) return a.final_rank - b.final_rank;
      
      const ratingA = Number(a.average_rating) || 0;
      const ratingB = Number(b.average_rating) || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      
      const votesA = Number(a.total_votes) || 0;
      const votesB = Number(b.total_votes) || 0;
      return votesB - votesA;
    });
  }, [participants]);
};
