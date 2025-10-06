import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WinnerContent {
  id: string;
  participant_id: string;
  user_id: string;
  payment_proof_url?: string;
  testimonial_video_url?: string;
  testimonial_text?: string;
  created_at: string;
  updated_at: string;
}

export const useWinnerContent = (participantId?: string, userId?: string) => {
  const [winnerContent, setWinnerContent] = useState<WinnerContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!participantId && !userId) return;

    const fetchWinnerContent = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from('winner_content').select('*');
        
        if (participantId) {
          query = query.eq('participant_id', participantId);
        } else if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          throw error;
        }

        setWinnerContent(data);
      } catch (err) {
        console.error('Error fetching winner content:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchWinnerContent();
  }, [participantId, userId]);

  return { winnerContent, loading, error };
};