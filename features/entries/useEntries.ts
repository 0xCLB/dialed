import { useCallback, useEffect, useState } from 'react';

import { listEntries } from '@/features/entries/entry-service';
import type { Entry } from '@/types/domain';

export function useEntries(limit = 30) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      setEntries(await listEntries(limit));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Entries failed to load.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    entries,
    setEntries,
    loading,
    refreshing,
    error,
    reload: () => load(),
    refresh: () => load(true),
  };
}
