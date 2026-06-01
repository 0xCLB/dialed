import { supabase } from '@/lib/supabase';
import { PILLAR_ORDER } from '@/lib/constants';
import type { EntryScore, EntryWithScore } from '@/features/entries/types';
import type {
  DailyScore,
  DaySummary,
  PillarProgress,
  Streak,
  WellnessPillar,
} from '@/features/progress/types';

type DailyScoreRow = {
  id: string;
  user_id: string;
  score_date: string;
  total_points: number;
  movement_points: number;
  fuel_points: number;
  mind_points: number;
  recovery_points: number;
  completed_pillars: number;
  all_pillars_completed: boolean;
  streak_count: number;
  rank_snapshot: number | null;
  created_at: string;
  updated_at: string;
};

type StreakRow = {
  user_id: string;
  current_streak: number | null;
  longest_streak: number | null;
  last_completed_date: string | null;
  movement_streak: number | null;
  fuel_streak: number | null;
  mind_streak: number | null;
  recovery_streak: number | null;
};

const ZERO_PILLAR_POINTS: Record<WellnessPillar, number> = {
  movement: 0,
  fuel: 0,
  mind: 0,
  recovery: 0,
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapDailyScore(row: DailyScoreRow): DailyScore {
  return {
    id: row.id,
    userId: row.user_id,
    scoreDate: row.score_date,
    totalPoints: row.total_points,
    movementPoints: row.movement_points,
    fuelPoints: row.fuel_points,
    mindPoints: row.mind_points,
    recoveryPoints: row.recovery_points,
    completedPillars: row.completed_pillars,
    allPillarsCompleted: row.all_pillars_completed,
    streakCount: row.streak_count,
    rankSnapshot: row.rank_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStreak(row: StreakRow): Streak {
  return {
    userId: row.user_id,
    currentStreak: Number(row.current_streak ?? 0),
    longestStreak: Number(row.longest_streak ?? 0),
    lastCompletedDate: row.last_completed_date,
    movementStreak: Number(row.movement_streak ?? 0),
    fuelStreak: Number(row.fuel_streak ?? 0),
    mindStreak: Number(row.mind_streak ?? 0),
    recoveryStreak: Number(row.recovery_streak ?? 0),
    source: 'server',
  };
}

function dateKeyDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return localDateKey(date);
}

function dayCounts(score: Pick<DailyScore, 'totalPoints' | 'completedPillars'>) {
  return score.totalPoints >= 25 || score.completedPillars >= 2;
}

function derivedStreak(userId: string, scores: DailyScore[]): Streak {
  const byDate = new Map(scores.map((score) => [score.scoreDate, score]));
  let currentStreak = 0;

  for (let offset = 0; offset < 45; offset += 1) {
    const score = byDate.get(dateKeyDaysAgo(offset));
    if (!score || !dayCounts(score)) {
      break;
    }
    currentStreak += 1;
  }

  let longestStreak = 0;
  let running = 0;
  const chronological = [...scores].sort((a, b) => a.scoreDate.localeCompare(b.scoreDate));
  for (const score of chronological) {
    if (dayCounts(score)) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  }

  const lastCompletedDate = [...scores].find(dayCounts)?.scoreDate ?? null;

  return {
    userId,
    currentStreak,
    longestStreak,
    lastCompletedDate,
    movementStreak: 0,
    fuelStreak: 0,
    mindStreak: 0,
    recoveryStreak: 0,
    source: 'derived',
  };
}

export async function getDailyScore(userId: string, date: string | Date) {
  const scoreDate = typeof date === 'string' ? date.slice(0, 10) : localDateKey(date);
  const { data, error } = await supabase
    .from('daily_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('score_date', scoreDate)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapDailyScore(data as DailyScoreRow) : null;
}

export async function getTodayScore(userId: string) {
  return getDailyScore(userId, new Date());
}

export async function getRecentDailyScores(userId: string, limit = 14) {
  const { data, error } = await supabase
    .from('daily_scores')
    .select('*')
    .eq('user_id', userId)
    .order('score_date', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as DailyScoreRow[]).map(mapDailyScore);
}

export function derivePillarProgressFromEntries(entries: EntryWithScore[]): PillarProgress[] {
  const points = { ...ZERO_PILLAR_POINTS };
  const pending: Record<WellnessPillar, number> = { ...ZERO_PILLAR_POINTS };
  const counts: Record<WellnessPillar, number> = { ...ZERO_PILLAR_POINTS };

  for (const entry of entries) {
    const pillar = (entry.score?.wellnessPillar ?? entry.wellnessPillar) as WellnessPillar | null;
    if (!pillar) {
      continue;
    }
    counts[pillar] += 1;
    if (entry.score) {
      points[pillar] += entry.score.points;
    } else {
      pending[pillar] += 1;
    }
  }

  return PILLAR_ORDER.map((pillar) => ({
    pillar,
    points: points[pillar],
    completed: points[pillar] > 0,
    pendingCount: pending[pillar],
    entryCount: counts[pillar],
  }));
}

export function deriveDailyTotalFromEntryScores(entries: EntryWithScore[]) {
  return entries.reduce((total, entry) => total + (entry.score?.points ?? 0), 0);
}

export async function getUserStreak(userId: string): Promise<Streak> {
  const { data, error } = await supabase
    .from('streaks')
    .select(
      'user_id, current_streak, longest_streak, last_completed_date, movement_streak, fuel_streak, mind_streak, recovery_streak',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return mapStreak(data as StreakRow);
  }

  return derivedStreak(userId, await getRecentDailyScores(userId, 45));
}

export function recomputeLocalDaySummary(
  entries: EntryWithScore[],
  entryScores: EntryScore[] = entries.flatMap((entry) => (entry.score ? [entry.score] : [])),
  date = localDateKey(),
  dailyScore?: DailyScore | null,
): DaySummary {
  const derivedProgress = derivePillarProgressFromEntries(entries);
  const progressByPillar = new Map(derivedProgress.map((progress) => [progress.pillar, progress]));

  const serverPoints = dailyScore
    ? {
        movement: dailyScore.movementPoints,
        fuel: dailyScore.fuelPoints,
        mind: dailyScore.mindPoints,
        recovery: dailyScore.recoveryPoints,
      }
    : null;

  const pillarProgress = PILLAR_ORDER.map((pillar) => {
    const derived = progressByPillar.get(pillar);
    const points =
      serverPoints?.[pillar] ??
      entryScores
        .filter((score) => score.wellnessPillar === pillar)
        .reduce((total, score) => total + score.points, 0);

    return {
      pillar,
      points,
      completed: points > 0,
      pendingCount: derived?.pendingCount ?? 0,
      entryCount: derived?.entryCount ?? 0,
    };
  });
  const completedPillars = pillarProgress
    .filter((progress) => progress.points > 0)
    .map((progress) => progress.pillar);
  const totalPoints =
    dailyScore?.totalPoints ??
    entryScores.reduce((total, score) => total + score.points, 0) ??
    deriveDailyTotalFromEntryScores(entries);

  return {
    date,
    totalPoints,
    completedPillars,
    pillarProgress,
    pendingEntries: entries.filter((entry) => !entry.score || entry.status === 'pending_score').length,
    entryCount: entries.length,
    fullyDialed: completedPillars.length === 4,
    source: dailyScore ? 'daily_score' : 'entry_scores',
  };
}
