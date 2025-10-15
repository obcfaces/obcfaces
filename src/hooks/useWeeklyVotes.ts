import { useEffect, useState } from 'react';
import { buildWeeklyTable, type TableRow } from '@/services/weeklyContest';
import { captureError } from '@/utils/errors';

export function useWeeklyVotes() {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const data = await buildWeeklyTable();
      setRows(data);
    } catch (e) {
      setError(e);
      captureError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { rows, loading, error, refresh };
}
