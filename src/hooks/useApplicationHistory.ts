import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ApplicationHistoryItem {
  id: string;
  application_data: any;
  status: string;
  notes: string | null;
  change_reason: string | null;
  created_at: string;
  changed_by: string | null;
}

export const useApplicationHistory = (applicationId?: string) => {
  const [history, setHistory] = useState<ApplicationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('contest_application_history')
          .select('*')
          .eq('application_id', applicationId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading application history:', error);
          setError(error.message);
          return;
        }

        setHistory(data || []);
      } catch (error) {
        console.error('Error loading application history:', error);
        setError('Failed to load application history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [applicationId]);

  return { history, loading, error };
};