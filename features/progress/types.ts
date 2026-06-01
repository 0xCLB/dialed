export type WellnessPillar = 'movement' | 'fuel' | 'mind' | 'recovery';

export type DailyScore = {
  id: string;
  userId: string;
  scoreDate: string;
  totalPoints: number;
  movementPoints: number;
  fuelPoints: number;
  mindPoints: number;
  recoveryPoints: number;
  completedPillars: number;
  allPillarsCompleted: boolean;
  streakCount: number;
  rankSnapshot: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Streak = {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  movementStreak: number;
  fuelStreak: number;
  mindStreak: number;
  recoveryStreak: number;
  source: 'server' | 'derived';
};

export type PillarProgress = {
  pillar: WellnessPillar;
  points: number;
  completed: boolean;
  pendingCount: number;
  entryCount: number;
};

export type DaySummary = {
  date: string;
  totalPoints: number;
  completedPillars: WellnessPillar[];
  pillarProgress: PillarProgress[];
  pendingEntries: number;
  entryCount: number;
  fullyDialed: boolean;
  source: 'daily_score' | 'entry_scores';
};

export type ProfileStats = {
  totalPoints: number;
  fullyDialedDays: number;
  currentStreak: number;
  longestStreak: number;
  recentDays: DailyScore[];
  pillarBalance: PillarProgress[];
};
