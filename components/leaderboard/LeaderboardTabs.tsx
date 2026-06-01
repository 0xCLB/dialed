import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { LeaderboardRange } from '@/features/leaderboard/types';

const OPTIONS: Array<{ value: LeaderboardRange; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'all_time', label: 'All-Time' },
];

export function LeaderboardTabs({
  value,
  onChange,
}: {
  value: LeaderboardRange;
  onChange: (value: LeaderboardRange) => void;
}) {
  return <SegmentedControl value={value} options={OPTIONS} onChange={onChange} />;
}
