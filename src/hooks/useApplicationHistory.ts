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

        // Remove duplicates based on application_data content and status
        const uniqueHistory = [];
        const seen = new Set();
        
        for (const item of data || []) {
          const key = JSON.stringify({ 
            application_data: item.application_data, 
            status: item.status 
          });
          if (!seen.has(key)) {
            seen.add(key);
            uniqueHistory.push(item);
          }
        }

        setHistory(uniqueHistory);
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