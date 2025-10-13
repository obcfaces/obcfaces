import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WeekInterval {
  interval: string;
  weeksAgo: number;
}

export const usePastWeekIntervals = (countryCode: string, timezone: string) => {
  const [intervals, setIntervals] = useState<WeekInterval[]>([]);
  const [loading, setLoading] = useState(true);

  const getCurrentMonday = useCallback(() => {
    // Строгий UTC понедельник (совпадение с Edge/cron)
    const now = new Date();
    const currentUTC = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
    ));
    const dow = currentUTC.getUTCDay();
    const daysToSubtract = dow === 0 ? 6 : dow - 1;
    currentUTC.setUTCDate(currentUTC.getUTCDate() - daysToSubtract);
    currentUTC.setUTCHours(0, 0, 0, 0);
    return currentUTC;
  }, []);

  const parseIntervalToMonday = useCallback((interval: string): Date | null => {
    try {
      const parts = interval.split('-');
      if (parts.length !== 2) return null;
      
      const startParts = parts[0].split('/');
      if (startParts.length !== 2) return null;
      
      const endParts = parts[1].split('/');
      if (endParts.length !== 3) return null;
      
      const day = parseInt(startParts[0]);
      const month = parseInt(startParts[1]) - 1;
      const year = parseInt(endParts[2]);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      
      // Return UTC date for consistent comparison with getCurrentMonday
      return new Date(Date.UTC(fullYear, month, day, 0, 0, 0, 0));
    } catch (error) {
      console.error('Error parsing interval:', interval, error);
      return null;
    }
  }, []);

  useEffect(() => {
    const loadIntervals = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('weekly_contest_participants')
          .select('week_interval')
          .eq('admin_status', 'past')
          .eq('is_active', true)
          .is('deleted_at', null);
        
        if (error) {
          console.error('Error loading past week intervals:', error);
          return;
        }
        
        const uniqueIntervals = Array.from(
          new Set(data?.map(p => p.week_interval).filter(Boolean) as string[])
        );
        
        const currentMonday = getCurrentMonday();
        const intervalsMap = new Map<string, WeekInterval>();
        
        uniqueIntervals.forEach(interval => {
          const intervalMonday = parseIntervalToMonday(interval);
          if (!intervalMonday) return;
          
          // Calculate weeks ago from NEXT Monday (so current week interval shows as "1 week ago")
          const nextMonday = new Date(currentMonday);
          nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
          
          const diffTime = nextMonday.getTime() - intervalMonday.getTime();
          const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
          const weeksAgo = Math.floor(diffDays / 7);
          
          // Only include intervals that are at least 1 week ago
          if (weeksAgo > 0) {
            intervalsMap.set(interval, { interval, weeksAgo });
          }
        });
        
        const sortedIntervals = Array.from(intervalsMap.values())
          .sort((a, b) => a.weeksAgo - b.weeksAgo);
        
        setIntervals(sortedIntervals);
      } catch (error) {
        console.error('Error loading past week intervals:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadIntervals();
  }, [countryCode, timezone, getCurrentMonday, parseIntervalToMonday]);

  return { intervals, loading };
};
