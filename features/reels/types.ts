import type { EntryWithScore, WellnessPillar } from '@/features/entries/types';
import type { LeaderboardRow } from '@/features/leaderboard/types';
import type { DailyScore, DaySummary, PillarProgress, Streak } from '@/features/progress/types';
import type { ProfileSummary } from '@/features/social/types';

export type ReelType = 'daily' | 'weekly';

export type ReelSlideType = 'intro' | 'entry' | 'pillar_summary' | 'leaderboard' | 'digest' | 'outro';

export type ReelTemplate = 'clean' | 'dark' | 'pastel' | 'athlete' | 'leaderboard' | 'fully_dialed';

export type ReelExportStatus = 'idle' | 'rendering' | 'ready' | 'failed';

export type ReelSlide = {
  id: string;
  type: ReelSlideType;
  date: string;
  title: string;
  subtitle: string;
  kicker: string;
  points?: number | null;
  mediaUrl?: string | null;
  entry?: EntryWithScore | null;
  pillar?: WellnessPillar | null;
  pillarProgress?: PillarProgress[];
  completedPillars?: WellnessPillar[];
  missingPillars?: WellnessPillar[];
  leaderboardRow?: LeaderboardRow | null;
  leaderboardRows?: LeaderboardRow[];
  profile?: ProfileSummary | null;
  streak?: Streak | null;
  timestamp?: string | null;
  aiSubtext?: string | null;
  metadata?: Record<string, unknown>;
};

export type ReelData = {
  id: string;
  type: ReelType;
  date: string;
  template: ReelTemplate;
  profile: ProfileSummary | null;
  username?: string | null;
  displayName: string;
  totalPoints: number;
  dailyScore: DailyScore | null;
  daySummary: DaySummary;
  entries: EntryWithScore[];
  streak: Streak | null;
  leaderboard:
    | {
        row: LeaderboardRow | null;
        rows: LeaderboardRow[];
      }
    | null;
  digestQuote?: string | null;
  mediaUrls: string[];
  slides: ReelSlide[];
  watermark: boolean;
  deepLink: string;
  inviteCode?: string | null;
  metadata?: Record<string, unknown>;
};

export type ReelExportResult = {
  status: ReelExportStatus;
  uri?: string;
  slideUris?: string[];
  assetId?: string;
  storagePath?: string;
  shared?: boolean;
  uploaded?: boolean;
  error?: string;
  exportKind: 'cover_image' | 'image_sequence' | 'video_stub';
};
