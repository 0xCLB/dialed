import type { WellnessPillar } from '@/features/entries/types';

export type HealthProvider =
  | 'apple_health'
  | 'fitbit'
  | 'oura'
  | 'garmin'
  | 'strava'
  | 'whoop'
  | 'manual';

export type HealthMetricType =
  | 'steps'
  | 'workout'
  | 'sleep'
  | 'heart_rate'
  | 'hrv'
  | 'calories'
  | 'mindfulness'
  | 'recovery';

export type HealthSample = {
  id?: string;
  userId: string;
  provider: HealthProvider;
  metricType: HealthMetricType;
  value: number | null;
  unit: string | null;
  startedAt: string;
  endedAt: string | null;
  sourceIdentifier: string | null;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type HealthSyncStatus = {
  provider: HealthProvider;
  available: boolean;
  connected: boolean;
  permissionGranted: boolean;
  lastSyncedAt: string | null;
  message: string;
  requiresDevelopmentBuild?: boolean;
};

export type HealthProviderConnection = {
  provider: HealthProvider;
  label: string;
  connected: boolean;
  available: boolean;
  comingSoon?: boolean;
  pro?: boolean;
  lastSyncedAt: string | null;
  supportedMetrics: HealthMetricType[];
  message: string;
};

export type HealthScoreResult = {
  sampleId?: string;
  metricType: HealthMetricType;
  pillar: WellnessPillar;
  basePoints: number;
  bonusPoints: number;
  points: number;
  explanation: string;
  source: 'health';
};

export type HealthPrivacySettings = {
  userId: string;
  useHealthDataForPoints: boolean;
  showHealthAchievementsToFriends: boolean;
  rawHealthMetricsPrivate: boolean;
  updatedAt: string;
};

export type HealthTodaySummary = {
  userId: string;
  date: string;
  samples: HealthSample[];
  totalPoints: number;
  movementPoints: number;
  mindPoints: number;
  recoveryPoints: number;
  sampleCount: number;
  lastSyncedAt: string | null;
  connectedProviders: HealthProvider[];
};

export type WearableProviderAdapter = {
  id: HealthProvider;
  label: string;
  connect(userId?: string): Promise<HealthSyncStatus>;
  disconnect(userId?: string): Promise<HealthSyncStatus>;
  getConnectionStatus(userId?: string): Promise<HealthSyncStatus>;
  syncToday(userId: string): Promise<HealthSample[]>;
  syncRange(userId: string, startDate: string | Date, endDate: string | Date): Promise<HealthSample[]>;
  normalizeSamples(raw: unknown, userId: string): HealthSample[];
  supportsMetric(metric: HealthMetricType): boolean;
};
