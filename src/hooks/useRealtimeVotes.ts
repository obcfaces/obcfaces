import { useEffect } from 'react';
import { supabase } from '@/data/supabaseClient';

/**
 * Subscribe to realtime changes on next_week_votes table
 */
export function useRealtimeVotes(onChange: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('next_week_votes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'next_week_votes' },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}
