import {
  getHealthSamplesForDate,
  saveHealthSamples,
  syncAppleHealthToday,
} from '@/features/health/healthService';
import type { HealthSample } from '@/features/health/types';
import type { HealthMetricSnapshot } from '@/types/domain';

export * from '@/features/health/healthService';
export * from '@/features/health/types';

function snapshotFromSamples(samples: HealthSample[]): HealthMetricSnapshot {
  const valueFor = (metricType: HealthSample['metricType']) =>
    samples.find((sample) => sample.metricType === metricType)?.value ?? 0;

  return {
    steps: Number(valueFor('steps')),
    activeEnergyKcal: Number(valueFor('calories')),
    exerciseMinutes: Number(valueFor('workout')),
    sleepMinutes: Number(valueFor('sleep')),
    mindfulMinutes: Number(valueFor('mindfulness')),
    source: 'apple_health',
    syncedAt: new Date().toISOString(),
  };
}

export async function syncTodayHealth(userId: string, date = new Date()) {
  const result = await syncAppleHealthToday(userId, date);
  return snapshotFromSamples(result.samples);
}

export async function upsertHealthSnapshot(
  userId: string,
  date: Date,
  snapshot: HealthMetricSnapshot,
) {
  const samples: HealthSample[] = [
    {
      userId,
      provider: 'apple_health',
      metricType: 'steps',
      value: snapshot.steps ?? 0,
      unit: 'count',
      startedAt: date.toISOString(),
      endedAt: date.toISOString(),
      sourceIdentifier: 'legacy_snapshot',
      metadata: { source: 'legacy_snapshot' },
    },
    {
      userId,
      provider: 'apple_health',
      metricType: 'calories',
      value: snapshot.activeEnergyKcal ?? 0,
      unit: 'kcal',
      startedAt: date.toISOString(),
      endedAt: date.toISOString(),
      sourceIdentifier: 'legacy_snapshot',
      metadata: { source: 'legacy_snapshot' },
    },
    {
      userId,
      provider: 'apple_health',
      metricType: 'workout',
      value: snapshot.exerciseMinutes ?? 0,
      unit: 'min',
      startedAt: date.toISOString(),
      endedAt: date.toISOString(),
      sourceIdentifier: 'legacy_snapshot',
      metadata: { source: 'legacy_snapshot' },
    },
    {
      userId,
      provider: 'apple_health',
      metricType: 'sleep',
      value: snapshot.sleepMinutes ?? 0,
      unit: 'min',
      startedAt: date.toISOString(),
      endedAt: date.toISOString(),
      sourceIdentifier: 'legacy_snapshot',
      metadata: { source: 'legacy_snapshot' },
    },
    {
      userId,
      provider: 'apple_health',
      metricType: 'mindfulness',
      value: snapshot.mindfulMinutes ?? 0,
      unit: 'min',
      startedAt: date.toISOString(),
      endedAt: date.toISOString(),
      sourceIdentifier: 'legacy_snapshot',
      metadata: { source: 'legacy_snapshot' },
    },
  ];

  return saveHealthSamples(samples.filter((sample) => Number(sample.value ?? 0) > 0));
}

export async function getLatestHealthSnapshot(userId: string) {
  const samples = await getHealthSamplesForDate(userId, new Date());
  return samples.length > 0 ? snapshotFromSamples(samples) : null;
}
