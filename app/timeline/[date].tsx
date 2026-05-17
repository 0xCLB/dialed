import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { EntryCard } from '@/features/entries/EntryCard';
import { listEntriesForDate } from '@/features/entries/entry-service';
import type { Entry } from '@/types/domain';

export default function TimelineDateScreen() {
  useRequireSession();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setEntries(await listEntriesForDate(date));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Timeline failed to load.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [date]);

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <View style={styles.title}>
          <Text variant="subtitle">Timeline</Text>
          <Text variant="caption" muted>
            {date}
          </Text>
        </View>
      </View>
      {loading ? <LoadingState label="Loading timeline" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && entries.length === 0 ? (
        <EmptyState title="Nothing logged" body="No scored proofs were found for this date." />
      ) : null}
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  title: {
    flex: 1,
  },
});
