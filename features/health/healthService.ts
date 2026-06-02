import AsyncStorage from '@react-native-async-storage/async-storage';

import { requestEntryScore } from '@/features/entries/entryService';
import { clearHealthKitError, noteHealthKitError } from '@/features/dev/diagnosticsStore';
import { buildProofMetadata } from '@/features/entries/proofPolicy';
import type { Entry } from '@/features/entries/types';
import {
  checkAppleHealthStatus,
  readAppleHealthSamplesForDate,
  requestAppleHealthPermissions,
} from '@/features/health/appleHealthService';
import { getProviderMetadata } from '@/features/health/providerAdapter';
import { scoreHealthSample, scoreHealthSamples } from '@/features/health/healthScoringService';
import type {
  HealthPrivacySettings,
  HealthProvider,
  HealthProviderConnection,
  HealthSample,
  HealthTodaySummary,
} from '@/features/health/types';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

type HealthSampleRow = {
  id: string;
  user_id: string;
  provider: HealthProvider;
  metric_type: HealthSample['metricType'];
  value: number | string | null;
  unit: string | null;
  started_at: string;
  ended_at: string | null;
  source_identifier: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

type HealthSyncResult = {
  samples: HealthSample[];
  entriesCreated: number;
  summary: HealthTodaySummary;
};

const DB_SUPPORTED_PROVIDERS = new Set<HealthProvider>([
  'apple_health',
  'manual',
  'whoop',
  'oura',
  'garmin',
  'strava',
]);

const PROVIDER_ORDER: HealthProvider[] = [
  'apple_health',
  'fitbit',
  'oura',
  'garmin',
  'whoop',
  'strava',
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toNumber(value: number | string | null) {
  if (value === null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateWindow(date: string | Date) {
  const key = typeof date === 'string' ? date.slice(0, 10) : localDateKey(date);
  const [year, month, day] = key.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { key, start: start.toISOString(), end: end.toISOString() };
}

function mapHealthSample(row: HealthSampleRow): HealthSample {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    metricType: row.metric_type,
    value: toNumber(row.value),
    unit: row.unit,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    sourceIdentifier: row.source_identifier,
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toHealthSampleInsert(sample: HealthSample) {
  if (!DB_SUPPORTED_PROVIDERS.has(sample.provider)) {
    throw new Error(`${sample.provider} samples require a backend provider migration before syncing.`);
  }

  return {
    user_id: sample.userId,
    provider: sample.provider,
    metric_type: sample.metricType,
    value: sample.value,
    unit: sample.unit,
    started_at: sample.startedAt,
    ended_at: sample.endedAt,
    source_identifier: sample.sourceIdentifier,
    metadata: {
      ...sample.metadata,
      privacy: 'private',
      health_engine_version: 1,
    },
  };
}

function privacyKey(userId: string) {
  return `dialed.healthPrivacy.${userId}`;
}

function defaultPrivacySettings(userId: string): HealthPrivacySettings {
  return {
    userId,
    useHealthDataForPoints: true,
    showHealthAchievementsToFriends: false,
    rawHealthMetricsPrivate: true,
    updatedAt: new Date().toISOString(),
  };
}

function metricLabel(metricType: HealthSample['metricType']) {
  if (metricType === 'steps') return 'Step goal';
  if (metricType === 'workout') return 'Workout minutes';
  if (metricType === 'calories') return 'Active energy';
  if (metricType === 'sleep') return 'Sleep logged';
  if (metricType === 'mindfulness') return 'Mindful minutes';
  if (metricType === 'hrv') return 'HRV context';
  if (metricType === 'recovery') return 'Recovery score';
  return 'Health signal';
}

function activityTagForSample(sample: HealthSample) {
  return `health_${sample.metricType}`;
}

function groupKey(sample: HealthSample) {
  return `${sample.userId}:${sample.provider}:${sample.metricType}:${sample.startedAt.slice(0, 10)}`;
}

export async function getHealthPrivacySettings(userId: string): Promise<HealthPrivacySettings> {
  const raw = await AsyncStorage.getItem(privacyKey(userId));
  if (!raw) return defaultPrivacySettings(userId);

  try {
    return { ...defaultPrivacySettings(userId), ...(JSON.parse(raw) as Partial<HealthPrivacySettings>) };
  } catch {
    return defaultPrivacySettings(userId);
  }
}

export async function updateHealthPrivacySettings(
  userId: string,
  patch: Partial<Omit<HealthPrivacySettings, 'userId' | 'updatedAt'>>,
) {
  const next: HealthPrivacySettings = {
    ...(await getHealthPrivacySettings(userId)),
    ...patch,
    userId,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(privacyKey(userId), JSON.stringify(next));
  track('health_privacy_updated', {
    useHealthDataForPoints: next.useHealthDataForPoints,
    showHealthAchievementsToFriends: next.showHealthAchievementsToFriends,
  });
  return next;
}

export async function saveHealthSamples(samples: HealthSample[]) {
  const supportedSamples = samples.filter((sample) => DB_SUPPORTED_PROVIDERS.has(sample.provider));
  if (supportedSamples.length === 0) return [];

  const uniqueGroups = new Map<string, HealthSample>();
  for (const sample of supportedSamples) {
    uniqueGroups.set(groupKey(sample), sample);
  }

  for (const sample of uniqueGroups.values()) {
    const { start, end } = dateWindow(sample.startedAt);
    const { error } = await supabase
      .from('health_samples')
      .delete()
      .eq('user_id', sample.userId)
      .eq('provider', sample.provider)
      .eq('metric_type', sample.metricType)
      .gte('started_at', start)
      .lt('started_at', end);

    if (error) throw error;
  }

  const { data, error } = await supabase
    .from('health_samples')
    .insert(supportedSamples.map(toHealthSampleInsert))
    .select('*');

  if (error) throw error;
  return ((data ?? []) as HealthSampleRow[]).map(mapHealthSample);
}

async function replaceHealthEntriesForSamples(samples: HealthSample[]) {
  const providerDays = new Map<string, HealthSample>();
  for (const sample of samples) {
    providerDays.set(`${sample.provider}:${sample.startedAt.slice(0, 10)}`, sample);
  }

  for (const sample of providerDays.values()) {
    const { start, end } = dateWindow(sample.startedAt);
    const query = supabase
      .from('entries')
      .delete()
      .eq('user_id', sample.userId)
      .eq('entry_type', 'health')
      .gte('occurred_at', start)
      .lt('occurred_at', end)
      .contains('metadata', { health_provider: sample.provider });
    const { error } = await query;
    if (error) throw error;
  }
}

export async function createHealthEntriesFromSamples(samples: HealthSample[]) {
  if (samples.length === 0) return [] as Entry[];

  const privacy = await getHealthPrivacySettings(samples[0].userId);
  if (!privacy.useHealthDataForPoints) {
    return [] as Entry[];
  }

  await replaceHealthEntriesForSamples(samples);

  const entryRows = samples
    .map((sample) => ({ sample, score: scoreHealthSample(sample) }))
    .filter(({ score }) => score.points > 0)
    .map(({ sample, score }) => ({
      user_id: sample.userId,
      entry_type: 'health',
      activity_tag: activityTagForSample(sample),
      caption: score.explanation,
      wellness_pillar: score.pillar,
      visibility: 'private',
      status: 'pending_score',
      occurred_at: sample.endedAt ?? sample.startedAt,
      metadata: {
        ...buildProofMetadata({
          proofType: 'health',
          verificationMethod: 'health',
          trustLevel: 'verified_health',
          rankedEligible: true,
          scoreRequested: true,
          consumesDailyProof: false,
        }),
        source: 'health',
        health_provider: sample.provider,
        health_metric_type: sample.metricType,
        health_sample_id: sample.id,
        health_score_preview: score,
        raw_health_metrics_private: privacy.rawHealthMetricsPrivate,
        public_health_achievement: privacy.showHealthAchievementsToFriends,
      },
    }));

  if (entryRows.length === 0) return [] as Entry[];

  const { data, error } = await supabase.from('entries').insert(entryRows).select('*');
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    user_id: string;
    entry_type: 'photo' | 'manual' | 'health' | 'location';
    activity_tag: string | null;
    caption: string | null;
    location_name: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    wellness_pillar: Entry['wellnessPillar'];
    visibility: Entry['visibility'];
    status: Entry['status'];
    occurred_at: string;
    metadata: unknown;
    created_at: string;
    updated_at: string;
  }>;

  await Promise.allSettled(rows.map((row) => requestEntryScore(row.id)));

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    entryType: row.entry_type,
    activityTag: row.activity_tag,
    caption: row.caption,
    locationName: row.location_name,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    wellnessPillar: row.wellness_pillar,
    visibility: row.visibility,
    status: row.status,
    occurredAt: row.occurred_at,
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getHealthSamplesForDate(userId: string, date: string | Date = new Date()) {
  const { start, end } = dateWindow(date);
  const { data, error } = await supabase
    .from('health_samples')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', start)
    .lt('started_at', end)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as HealthSampleRow[]).map(mapHealthSample);
}

export function summarizeHealthSamples(
  userId: string,
  date: string | Date,
  samples: HealthSample[],
): HealthTodaySummary {
  const scores = scoreHealthSamples(samples);
  const movementPoints = scores
    .filter((score) => score.pillar === 'movement')
    .reduce((total, score) => total + score.points, 0);
  const mindPoints = scores
    .filter((score) => score.pillar === 'mind')
    .reduce((total, score) => total + score.points, 0);
  const recoveryPoints = scores
    .filter((score) => score.pillar === 'recovery')
    .reduce((total, score) => total + score.points, 0);
  const lastSyncedAt = samples.reduce<string | null>((latest, sample) => {
    const stamp = sample.updatedAt ?? sample.createdAt ?? null;
    if (!stamp) return latest;
    return !latest || stamp > latest ? stamp : latest;
  }, null);

  return {
    userId,
    date: dateWindow(date).key,
    samples,
    totalPoints: movementPoints + mindPoints + recoveryPoints,
    movementPoints,
    mindPoints,
    recoveryPoints,
    sampleCount: samples.length,
    lastSyncedAt,
    connectedProviders: [...new Set(samples.map((sample) => sample.provider))],
  };
}

export async function getTodayHealthSummary(userId: string, date: string | Date = new Date()) {
  const samples = await getHealthSamplesForDate(userId, date);
  return summarizeHealthSamples(userId, date, samples);
}

export async function syncAppleHealthToday(
  userId: string,
  date: string | Date = new Date(),
): Promise<HealthSyncResult> {
  track('health_sync_started', { provider: 'apple_health' });

  try {
    await requestAppleHealthPermissions();
    const rawSamples = await readAppleHealthSamplesForDate(userId, date);
    const samples = await saveHealthSamples(rawSamples);
    const entries = await createHealthEntriesFromSamples(samples);
    const summary = summarizeHealthSamples(userId, date, samples);
    track('health_sync_success', {
      provider: 'apple_health',
      samples: samples.length,
      entries: entries.length,
      points: summary.totalPoints,
    });
    clearHealthKitError();
    return {
      samples,
      entriesCreated: entries.length,
      summary,
    };
  } catch (error) {
    track('health_sync_failed', {
      provider: 'apple_health',
      message: error instanceof Error ? error.message : 'unknown',
    });
    noteHealthKitError(error);
    throw error;
  }
}

export async function getConnectedProviders(userId: string): Promise<HealthProviderConnection[]> {
  const { data } = await supabase
    .from('health_samples')
    .select('provider, updated_at, created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(40);

  const latestByProvider = new Map<HealthProvider, string>();
  for (const row of (data ?? []) as Array<{ provider: HealthProvider; updated_at?: string | null; created_at?: string | null }>) {
    if (!latestByProvider.has(row.provider)) {
      latestByProvider.set(row.provider, row.updated_at ?? row.created_at ?? new Date().toISOString());
    }
  }

  const appleStatus = await checkAppleHealthStatus().catch(() => null);

  return PROVIDER_ORDER.map((provider) => {
    const meta = getProviderMetadata(provider);
    const lastSyncedAt = latestByProvider.get(provider) ?? null;
    const isAppleHealth = provider === 'apple_health';
    return {
      provider,
      label: meta.label,
      connected: Boolean(lastSyncedAt) || Boolean(isAppleHealth && appleStatus?.connected),
      available: isAppleHealth ? Boolean(appleStatus?.available) : false,
      comingSoon: meta.comingSoon,
      pro: meta.pro,
      lastSyncedAt,
      supportedMetrics: meta.supportedMetrics,
      message: meta.comingSoon
        ? `${meta.label} connector is queued for the wearable pass.`
        : isAppleHealth && appleStatus?.requiresDevelopmentBuild
          ? appleStatus.message
        : lastSyncedAt
          ? 'Connected and syncing private health samples.'
          : 'Ready to connect on an iPhone development build.',
    };
  });
}

export function healthSampleDisplay(sample: HealthSample) {
  const value = Number(sample.value ?? 0);
  const unit = sample.unit ?? '';
  return {
    label: metricLabel(sample.metricType),
    value:
      sample.metricType === 'sleep'
        ? `${(value / 60).toFixed(1)}h`
        : `${Math.round(value).toLocaleString()}${unit && unit !== 'count' ? ` ${unit}` : ''}`,
    score: scoreHealthSample(sample),
  };
}
