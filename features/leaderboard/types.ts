import type { WellnessPillar } from '@/features/progress/types';
import type { ProfileSummary } from '@/features/social/types';

export type LeaderboardRange = 'daily' | 'weekly' | 'all_time';

export type LeaderboardScope = 'friends' | 'global' | 'challenge';

export type PillarLeaderboardType = WellnessPillar | 'all';

export type LeaderboardRow = {
  userId: string;
  rank: number;
  points: number;
  entries: number;
  completedPillars: number;
  streak: number;
  movement: number;
  fuel: number;
  mind: number;
  recovery: number;
  profile: ProfileSummary | null;
  isCurrentUser: boolean;
};
