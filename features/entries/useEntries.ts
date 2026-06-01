import { useCallback, useState } from 'react';

import { listRecentEntries } from '@/features/entries/entryService';
import type { EntryWithScore } from '@/features/entries/types';

export function useEntries(limit = 30) {
  const [entries, setEntries] = useState<EntryWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (userId: string, asRefresh = false) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      setEntries(await listRecentEntries(userId, limit));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Entries failed to load.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit]);

  return {
    entries,
    setEntries,
    loading,
    refreshing,
    error,
    load,
    reload: load,
    refresh: (userId: string) => load(userId, true),
  };
}
