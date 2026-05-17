import { format } from 'date-fns';

import { DATE_KEY_FORMAT, PILLAR_ORDER } from '@/lib/constants';
import type { DailyDigest, Entry } from '@/types/domain';

export function buildDailyDigest(entries: Entry[], date = new Date()): DailyDigest {
  const score = entries.reduce((total, entry) => total + entry.score, 0);
  const completedPillars = PILLAR_ORDER.filter((pillar) =>
    entries.some((entry) => entry.pillar === pillar),
  );
  const topEntry = [...entries].sort((a, b) => b.score - a.score)[0];
  const summary =
    entries.length === 0
      ? 'No proofs yet today.'
      : `${entries.length} proofs logged. Top action: ${topEntry.title}.`;

  return {
    date: format(date, DATE_KEY_FORMAT),
    score,
    entries: entries.length,
    completedPillars,
    streakDays: 1,
    summary,
  };
}
