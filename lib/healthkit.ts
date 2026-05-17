import { Platform } from 'react-native';
import * as HealthKit from '@kingstinct/react-native-healthkit';

import type { HealthMetricSnapshot } from '@/types/domain';

const READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKCategoryTypeIdentifierMindfulSession',
] as const;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export async function isAppleHealthAvailable() {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return HealthKit.isHealthDataAvailable();
}

export async function requestAppleHealthAuthorization() {
  if (!(await isAppleHealthAvailable())) {
    return false;
  }
  return HealthKit.requestAuthorization({ toRead: [...READ_TYPES] });
}

async function queryQuantityTotal(identifier: string, unit: string, date: Date) {
  const result = await (HealthKit.queryStatisticsForQuantity as any)(
    identifier,
    ['cumulativeSum'],
    {
      from: startOfDay(date).toISOString(),
      to: endOfDay(date).toISOString(),
      unit,
    },
  );

  const firstSource = result?.sources?.[0];
  return Math.round(firstSource?.quantity ?? result?.sumQuantity?.quantity ?? 0);
}

async function queryCategoryMinutes(identifier: string, date: Date) {
  const samples = await (HealthKit.queryCategorySamples as any)(identifier, {
    from: startOfDay(date).toISOString(),
    to: endOfDay(date).toISOString(),
  });

  const rows = Array.isArray(samples) ? samples : samples?.samples ?? [];
  return Math.round(
    rows.reduce((total: number, sample: { startDate: string; endDate: string }) => {
      const start = new Date(sample.startDate).getTime();
      const end = new Date(sample.endDate).getTime();
      return total + Math.max(0, end - start) / 60000;
    }, 0),
  );
}

export async function getDailyHealthSnapshot(date = new Date()): Promise<HealthMetricSnapshot> {
  await requestAppleHealthAuthorization();

  const [steps, activeEnergyKcal, exerciseMinutes, sleepMinutes, mindfulMinutes] =
    await Promise.all([
      queryQuantityTotal('HKQuantityTypeIdentifierStepCount', 'count', date),
      queryQuantityTotal('HKQuantityTypeIdentifierActiveEnergyBurned', 'kcal', date),
      queryQuantityTotal('HKQuantityTypeIdentifierAppleExerciseTime', 'min', date),
      queryCategoryMinutes('HKCategoryTypeIdentifierSleepAnalysis', date),
      queryCategoryMinutes('HKCategoryTypeIdentifierMindfulSession', date),
    ]);

  return {
    steps,
    activeEnergyKcal,
    exerciseMinutes,
    sleepMinutes,
    mindfulMinutes,
    source: 'apple_health',
    syncedAt: new Date().toISOString(),
  };
}
