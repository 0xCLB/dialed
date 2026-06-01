import type { LeaderboardRange, LeaderboardRow } from '@/features/leaderboard/types';
import type { EntryWithScore, WellnessPillar } from '@/features/entries/types';
import type { DaySummary, Streak } from '@/features/progress/types';
import type { ProfileSummary } from '@/features/social/types';

export type ShareCardType =
  | 'entry'
  | 'daily_score'
  | 'fully_dialed'
  | 'streak'
  | 'leaderboard'
  | 'friend_compare'
  | 'digest';

export type ShareCardTemplate =
  | 'clean'
  | 'dark'
  | 'pastel'
  | 'athlete'
  | 'leaderboard'
  | 'recovery'
  | 'hydration'
  | 'fully_dialed';

export type ShareCardData = {
  type: ShareCardType;
  template: ShareCardTemplate;
  title: string;
  subtitle: string;
  kicker: string;
  points?: number;
  username?: string | null;
  profile?: ProfileSummary | null;
  entry?: EntryWithScore | null;
  daySummary?: DaySummary | null;
  streak?: Streak | null;
  leaderboard?: {
    range: LeaderboardRange;
    row: LeaderboardRow | null;
    rows: LeaderboardRow[];
  } | null;
  friendCompare?: {
    friend: ProfileSummary | null;
    date: string;
    myPoints: number;
    friendPoints: number;
    winners: Partial<Record<WellnessPillar, string>>;
  } | null;
  digestQuote?: string | null;
  mediaUrl?: string | null;
  pillar?: WellnessPillar | null;
  completedPillars?: WellnessPillar[];
  inviteCode?: string | null;
  deepLink?: string;
  isPremium?: boolean;
  locked?: boolean;
  metadata?: Record<string, unknown>;
};

export type ShareExportResult = {
  uri: string;
  storagePath?: string;
  assetId?: string;
  shared?: boolean;
  uploaded?: boolean;
};
