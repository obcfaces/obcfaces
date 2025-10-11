import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useContestants } from './useContestants';
import { parseAgeRange, parseHeightRange, parseWeightRange, getFilterParam } from '@/utils/urlFilters';
import type { Contestant } from '../types';

interface FilterParams {
  countryCode: string;
  weekOffset: number;
  enabled?: boolean;
}

export const useContestantsWithFilters = ({ countryCode, weekOffset, enabled = true }: FilterParams) => {
  const [searchParams] = useSearchParams();
  
  // Extract filter params from URL
  const urlFilters = useMemo(() => ({
    gender: getFilterParam(searchParams, "gender"),
    age: getFilterParam(searchParams, "age"),
    maritalStatus: getFilterParam(searchParams, "marital"),
    hasChildren: getFilterParam(searchParams, "children"),
    heightRange: getFilterParam(searchParams, "height"),
    weightRange: getFilterParam(searchParams, "weight"),
  }), [searchParams]);

  // Fetch contestants
  const query = useContestants({
    countryCode,
    weekOffset,
    filters: {
      country: countryCode,
      gender: urlFilters.gender,
    },
    enabled,
  });

  // Apply client-side filters
  const filteredContestants = useMemo(() => {
    if (!query.data?.items) return [];

    let filtered = query.data.items;

    // Age filter
    if (urlFilters.age) {
      const [min, max] = parseAgeRange(urlFilters.age);
      filtered = filtered.filter(c => c.age >= min && c.age <= max);
    }

    // Marital status filter
    if (urlFilters.maritalStatus && urlFilters.maritalStatus !== 'all') {
      // Assumes marital_status is in application_data
      // filtered = filtered.filter(c => c.maritalStatus === urlFilters.maritalStatus);
    }

    // Has children filter
    if (urlFilters.hasChildren) {
      const hasKids = urlFilters.hasChildren === 'true';
      // filtered = filtered.filter(c => c.hasChildren === hasKids);
    }

    // Height filter
    if (urlFilters.heightRange && urlFilters.heightRange !== 'All Heights') {
      const [minH, maxH] = parseHeightRange(urlFilters.heightRange);
      filtered = filtered.filter(c => {
        if (!c.height_cm) return false;
        return c.height_cm >= minH && c.height_cm <= maxH;
      });
    }

    // Weight filter
    if (urlFilters.weightRange && urlFilters.weightRange !== 'All Weights') {
      const [minW, maxW] = parseWeightRange(urlFilters.weightRange);
      filtered = filtered.filter(c => {
        if (!c.weight_kg) return false;
        return c.weight_kg >= minW && c.weight_kg <= maxW;
      });
    }

    return filtered;
  }, [query.data?.items, urlFilters]);

  return {
    ...query,
    data: query.data ? { ...query.data, items: filteredContestants } : undefined,
  };
};
