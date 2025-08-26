import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.DEFAULT_TTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  isStale(key: string, staleTtl: number = 60000): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const now = Date.now();
    return (now - entry.timestamp) > staleTtl;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Singleton cache instance
const globalCache = new MemoryCache();

export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { ttl, staleWhileRevalidate = true } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = globalCache.get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          
          // If stale-while-revalidate is enabled, check if data is stale
          if (staleWhileRevalidate && globalCache.isStale(key)) {
            // Return cached data immediately, but fetch fresh data in background
            fetchData(true);
          }
          return;
        }
      }

      // Fetch fresh data
      setLoading(true);
      setError(null);
      
      const freshData = await fetcher();
      
      // Update cache
      globalCache.set(key, freshData, ttl);
      
      setData(freshData);
    } catch (err) {
      setError(err as Error);
      console.error('Cache fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, staleWhileRevalidate]);

  const invalidate = useCallback(() => {
    globalCache.invalidate(key);
  }, [key]);

  const invalidatePattern = useCallback((pattern: string) => {
    globalCache.invalidatePattern(pattern);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    invalidate,
    invalidatePattern
  };
};

// Export cache instance for manual operations
export { globalCache };

// Utility hooks for common data patterns
export const useContestParticipants = (weekOffset: number = 0) => {
  return useCache(
    `contest-participants-${weekOffset}`,
    async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.rpc('get_weekly_contest_participants_public', {
        weeks_offset: weekOffset
      });
      return data || [];
    },
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );
};

export const useUserProfile = (userId: string) => {
  return useCache(
    `profile-${userId}`,
    async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return data;
    },
    { ttl: 10 * 60 * 1000 } // 10 minutes cache
  );
};

export const useContestLeaderboard = (weekOffset: number = 0) => {
  return useCache(
    `leaderboard-${weekOffset}`,
    async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.rpc('get_contest_leaderboard', {
        contest_week_offset: weekOffset
      });
      return data || [];
    },
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );
};