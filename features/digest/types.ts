import type { EntryWithScore, WellnessPillar } from '@/features/entries/types';
import type { LeaderboardRow } from '@/features/leaderboard/types';
import type { DailyScore, DaySummary, PillarProgress, Streak } from '@/features/progress/types';
import type { ProfileSummary } from '@/features/social/types';

export type DigestTone = 'twain' | 'coach' | 'plain';

export type DigestInsightKey =
  | 'strongest_pillar'
  | 'weakest_pillar'
  | 'best_entry'
  | 'missed_opportunity'
  | 'friend_context'
  | 'tomorrow_recommendation'
  | 'share_quote';

export type DigestInsight = {
  key: DigestInsightKey;
  label: string;
  body: string;
  pillar?: WellnessPillar | null;
  value?: string | number | null;
};

export type DigestRecommendation = {
  title: string;
  body: string;
  pillar?: WellnessPillar | null;
  actionLabel: string;
  route?: string;
};

export type DigestInputSummary = {
  userId: string;
  date: string;
  profile: ProfileSummary | null;
  entries: EntryWithScore[];
  dailyScore: DailyScore | null;
  daySummary: DaySummary;
  totalPoints: number;
  scorePercent: number;
  pillarProgress: PillarProgress[];
  completedPillars: WellnessPillar[];
  missingPillars: WellnessPillar[];
  strongestPillar: PillarProgress | null;
  weakestPillar: PillarProgress | null;
  bestEntry: EntryWithScore | null;
  pendingEntries: number;
  streak: Streak | null;
  leaderboardRow: LeaderboardRow | null;
  leaderboardRows: LeaderboardRow[];
};

export type DailyDigest = {
  id?: string;
  userId: string;
  digestDate: string;
  tone: DigestTone;
  title: string;
  body: string;
  insights: DigestInsight[];
  scoreSummary: DigestInputSummary;
  recommendation: DigestRecommendation;
  shareQuote: string;
  source: 'stored' | 'edge' | 'fallback';
  persisted: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
};

export type DigestShareData = {
  title: string;
  quote: string;
  date: string;
  tone: DigestTone;
  digest: DailyDigest;
};
