import { Platform } from 'react-native';

import { track } from '@/lib/analytics';
import type { HealthMetricType, HealthSample, HealthSyncStatus } from '@/features/health/types';

const READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKCategoryTypeIdentifierMindfulSession',
] as const;

type HealthKitModule = typeof import('@kingstinct/react-native-healthkit');

async function getHealthKit(): Promise<HealthKitModule> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Health is only available on iOS.');
  }

  try {
    return await import('@kingstinct/react-native-healthkit');
  } catch {
    throw new Error('Apple Health requires an iOS development build with HealthKit enabled.');
  }
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
  return { key, start, end };
}

function asNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function extractQuantityTotal(result: unknown) {
  const row = result as {
    sumQuantity?: { quantity?: number } | number;
    quantity?: number;
    sources?: Array<{ quantity?: number; sumQuantity?: { quantity?: number } | number }>;
  };

  if (typeof row.sumQuantity === 'number') return row.sumQuantity;
  if (row.sumQuantity?.quantity !== undefined) return row.sumQuantity.quantity;
  if (row.quantity !== undefined) return row.quantity;
  if (Array.isArray(row.sources)) {
    return row.sources.reduce(
      (total, source) =>
        total +
        asNumber(
          typeof source.sumQuantity === 'number'
            ? source.sumQuantity
            : source.sumQuantity?.quantity ?? source.quantity,
        ),
      0,
    );
  }

  return 0;
}

async function queryQuantityTotal(identifier: string, unit: string, date: string | Date) {
  const HealthKit = await getHealthKit();
  const { start, end } = dateWindow(date);
  const result = await (HealthKit.queryStatisticsForQuantity as unknown as Function)(
    identifier,
    ['cumulativeSum'],
    {
      from: start.toISOString(),
      to: end.toISOString(),
      unit,
    },
  );
  return Math.round(extractQuantityTotal(result));
}

async function queryCategoryMinutes(identifier: string, date: string | Date) {
  const HealthKit = await getHealthKit();
  const { start, end } = dateWindow(date);
  const result = await (HealthKit.queryCategorySamples as unknown as Function)(identifier, {
    from: start.toISOString(),
    to: end.toISOString(),
    ascending: true,
  });
  const rows = Array.isArray(result) ? result : ((result as { samples?: unknown[] })?.samples ?? []);

  return Math.round(
    rows.reduce((total: number, sample: unknown) => {
      const row = sample as { startDate?: string; endDate?: string };
      if (!row.startDate || !row.endDate) return total;
      return total + Math.max(0, new Date(row.endDate).getTime() - new Date(row.startDate).getTime()) / 60000;
    }, 0),
  );
}

async function queryWorkoutMinutes(date: string | Date) {
  const HealthKit = await getHealthKit();
  const { start, end } = dateWindow(date);
  const result = await (HealthKit.queryWorkoutSamples as unknown as Function)({
    from: start.toISOString(),
    to: end.toISOString(),
    ascending: true,
    limit: 50,
  });
  const rows = Array.isArray(result) ? result : [];

  return Math.round(
    rows.reduce((total: number, sample: unknown) => {
      const row = sample as { startDate?: string; endDate?: string; duration?: number };
      if (row.duration) return total + row.duration / 60;
      if (!row.startDate || !row.endDate) return total;
      return total + Math.max(0, new Date(row.endDate).getTime() - new Date(row.startDate).getTime()) / 60000;
    }, 0),
  );
}

export async function isAppleHealthAvailable() {
  if (Platform.OS !== 'ios') return false;
  try {
    const HealthKit = await getHealthKit();
    return Boolean(await HealthKit.isHealthDataAvailableAsync());
  } catch {
    return false;
  }
}

export async function checkAppleHealthStatus(): Promise<HealthSyncStatus> {
  const available = await isAppleHealthAvailable();
  return {
    provider: 'apple_health',
    available,
    connected: available,
    permissionGranted: false,
    lastSyncedAt: null,
    message: available
      ? 'Apple Health is available on this device.'
      : 'Apple Health requires an iPhone development build with HealthKit enabled.',
    requiresDevelopmentBuild: Platform.OS !== 'ios' || !available,
  };
}

export async function requestAppleHealthPermissions(): Promise<HealthSyncStatus> {
  track('apple_health_permission_requested');
  const available = await isAppleHealthAvailable();
  if (!available) {
    return {
      provider: 'apple_health',
      available: false,
      connected: false,
      permissionGranted: false,
      lastSyncedAt: null,
      message: 'Apple Health is not available in this runtime.',
      requiresDevelopmentBuild: true,
    };
  }

  const HealthKit = await getHealthKit();
  const granted = await HealthKit.requestAuthorization({ toRead: [...READ_TYPES] });
  if (granted) {
    track('apple_health_connected');
  }

  return {
    provider: 'apple_health',
    available: true,
    connected: granted,
    permissionGranted: granted,
    lastSyncedAt: null,
    message: granted ? 'Apple Health connected.' : 'Apple Health permission was not granted.',
  };
}

function aggregateSample({
  userId,
  metricType,
  value,
  unit,
  date,
  sourceIdentifier,
  metadata = {},
}: {
  userId: string;
  metricType: HealthMetricType;
  value: number;
  unit: string;
  date: string | Date;
  sourceIdentifier: string;
  metadata?: Record<string, unknown>;
}): HealthSample {
  const { start, end } = dateWindow(date);
  return {
    userId,
    provider: 'apple_health',
    metricType,
    value,
    unit,
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    sourceIdentifier,
    metadata: {
      aggregate: true,
      privacy: 'private',
      ...metadata,
    },
  };
}

export async function readAppleHealthSamplesForDate(userId: string, date: string | Date = new Date()) {
  await requestAppleHealthPermissions();

  const [steps, activeEnergyKcal, workoutMinutes, sleepMinutes, mindfulMinutes] = await Promise.all([
    queryQuantityTotal('HKQuantityTypeIdentifierStepCount', 'count', date).catch(() => 0),
    queryQuantityTotal('HKQuantityTypeIdentifierActiveEnergyBurned', 'kcal', date).catch(() => 0),
    queryWorkoutMinutes(date).catch(() => 0),
    queryCategoryMinutes('HKCategoryTypeIdentifierSleepAnalysis', date).catch(() => 0),
    queryCategoryMinutes('HKCategoryTypeIdentifierMindfulSession', date).catch(() => 0),
  ]);

  return [
    aggregateSample({
      userId,
      metricType: 'steps',
      value: steps,
      unit: 'count',
      date,
      sourceIdentifier: 'HKQuantityTypeIdentifierStepCount',
    }),
    aggregateSample({
      userId,
      metricType: 'calories',
      value: activeEnergyKcal,
      unit: 'kcal',
      date,
      sourceIdentifier: 'HKQuantityTypeIdentifierActiveEnergyBurned',
    }),
    aggregateSample({
      userId,
      metricType: 'workout',
      value: workoutMinutes,
      unit: 'min',
      date,
      sourceIdentifier: 'HKWorkoutTypeIdentifier',
    }),
    aggregateSample({
      userId,
      metricType: 'sleep',
      value: sleepMinutes,
      unit: 'min',
      date,
      sourceIdentifier: 'HKCategoryTypeIdentifierSleepAnalysis',
    }),
    aggregateSample({
      userId,
      metricType: 'mindfulness',
      value: mindfulMinutes,
      unit: 'min',
      date,
      sourceIdentifier: 'HKCategoryTypeIdentifierMindfulSession',
    }),
  ].filter((sample) => (sample.value ?? 0) > 0);
}
