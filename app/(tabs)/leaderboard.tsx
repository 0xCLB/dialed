import { useEffect, useState } from 'react';

import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { LeaderboardRow } from '@/features/leaderboard/LeaderboardRow';
import { getLeaderboard } from '@/features/leaderboard/leaderboard-service';
import type { LeaderboardRow as LeaderboardRowType, LeaderboardScope } from '@/types/domain';

export default function LeaderboardScreen() {
  const [scope, setScope] = useState<LeaderboardScope>('daily');
  const [rows, setRows] = useState<LeaderboardRowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(nextScope = scope) {
    setLoading(true);
    setError(null);
    try {
      setRows(await getLeaderboard(nextScope));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Leaderboard failed to load.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(scope);
  }, [scope]);

  return (
    <Screen>
      <Text variant="title">Leaderboard</Text>
      <Text muted>Daily and weekly resets keep the competition fresh.</Text>
      <SegmentedControl
        value={scope}
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
        ]}
        onChange={setScope}
      />
      <Card>
        {loading ? <LoadingState label="Ranking friends" /> : null}
        {error ? <ErrorState message={error} onRetry={() => load(scope)} /> : null}
        {!loading && !error && rows.length === 0 ? (
          <EmptyState
            title="No scores yet"
            body="Leaderboards fill after scored proofs land."
          />
        ) : null}
        {rows.map((row) => (
          <LeaderboardRow key={row.userId} row={row} />
        ))}
      </Card>
    </Screen>
  );
}
