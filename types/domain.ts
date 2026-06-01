export type WellnessPillar = 'movement' | 'fuel' | 'mind' | 'recovery';

export type EntrySource = 'photo' | 'manual' | 'healthkit' | 'location';

export type EntryStatus = 'pending' | 'scored' | 'rejected';

export type LeaderboardScope = 'daily' | 'weekly';

export type GoalKey =
  | 'build_strength'
  | 'lose_fat'
  | 'run_faster'
  | 'sleep_better'
  | 'eat_cleaner'
  | 'reduce_stress'
  | 'stay_consistent';

export type ReactionType = 'fire' | 'dialed' | 'respect' | 'slippin' | 'water' | 'check';

export type ShareTemplate = 'proof' | 'rings' | 'weekly_digest' | 'challenge';

export type HealthMetricSnapshot = {
  steps?: number;
  activeEnergyKcal?: number;
  exerciseMinutes?: number;
  sleepMinutes?: number;
  mindfulMinutes?: number;
  workouts?: number;
  source: 'apple_health';
  syncedAt: string;
};

export type ScoreBreakdown = {
  base: number;
  proofBonus: number;
  streakBonus: number;
  healthBonus: number;
  qualityMultiplier: number;
  confidence: number;
  reasons: string[];
};

export type Profile = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  timezone: string;
  onboardingComplete: boolean;
  privacyDefault: 'private' | 'friends' | 'public';
  isPrivate: boolean;
  isPro: boolean;
  proUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Entry = {
  id: string;
  userId: string;
  pillar: WellnessPillar;
  source: EntrySource;
  actionType: string;
  title: string;
  caption: string | null;
  proofUrl: string | null;
  location: Record<string, unknown> | null;
  healthSnapshot: HealthMetricSnapshot | null;
  clientMetadata: Record<string, unknown>;
  aiSummary: string | null;
  shareHeadline: string | null;
  score: number;
  maxScore: number;
  confidence: number;
  scoreBreakdown: ScoreBreakdown | null;
  status: EntryStatus;
  occurredAt: string;
  createdAt: string;
};

export type Friend = {
  id: string;
  profile: Profile;
  status: 'pending' | 'accepted' | 'blocked';
  direction: 'incoming' | 'outgoing' | 'mutual';
  createdAt: string;
};

export type LeaderboardRow = {
  userId: string;
  rank: number;
  score: number;
  entries: number;
  movement: number;
  fuel: number;
  mind: number;
  recovery: number;
  profile: Pick<Profile, 'username' | 'displayName' | 'avatarUrl'>;
};

export type Challenge = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  pillar: WellnessPillar | 'all';
  startsAt: string;
  endsAt: string;
  isPrivate: boolean;
  entryGoal: number;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  actorId: string | null;
  type: 'reaction' | 'friend_request' | 'leaderboard' | 'challenge' | 'digest' | 'streak';
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type DailyDigest = {
  date: string;
  score: number;
  entries: number;
  completedPillars: WellnessPillar[];
  streakDays: number;
  summary: string;
};
