import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useContestants, type Contestant } from './useContestants';

interface FilterParams {
  countryCode: string;
  weekOffset: number;
  enabled?: boolean;
}

export const useContestantsWithFilters = ({ countryCode, weekOffset, enabled = true }: FilterParams) => {
  const [searchParams] = useSearchParams();
  
  // Extract filter params from URL
  const urlFilters = useMemo(() => ({
    gender: searchParams.get("gender") || undefined,
    age: searchParams.get("age") || undefined,
    maritalStatus: searchParams.get("marital") || undefined,
    hasChildren: searchParams.get("children") || undefined,
    heightRange: searchParams.get("height") || undefined,
    weightRange: searchParams.get("weight") || undefined,
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

// Helper functions
function parseAgeRange(range: string): [number, number] {
  if (range === '18-25') return [18, 25];
  if (range === '26-35') return [26, 35];
  if (range === '36-45') return [36, 45];
  if (range === '46+') return [46, 999];
  return [0, 999];
}

function parseHeightRange(range: string): [number, number] {
  // Format: "150-160 cm" or "5'0\"-5'5\""
  const match = range.match(/(\d+)-(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2])];
  }
  return [0, 999];
}

function parseWeightRange(range: string): [number, number] {
  // Format: "50-60 kg" or "110-130 lbs"
  const match = range.match(/(\d+)-(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2])];
  }
  return [0, 999];
}
