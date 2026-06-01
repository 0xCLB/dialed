import {
  isAppleHealthAvailable,
  readAppleHealthSamplesForDate,
  requestAppleHealthPermissions,
} from '@/features/health/appleHealthService';
import type { HealthSample } from '@/features/health/types';
import type { HealthMetricSnapshot } from '@/types/domain';

function valueFor(samples: HealthSample[], metricType: HealthSample['metricType']) {
  return Number(samples.find((sample) => sample.metricType === metricType)?.value ?? 0);
}

export { isAppleHealthAvailable };

export async function requestAppleHealthAuthorization() {
  const status = await requestAppleHealthPermissions();
  return status.permissionGranted;
}

export async function getDailyHealthSnapshot(date = new Date()): Promise<HealthMetricSnapshot> {
  const samples = await readAppleHealthSamplesForDate('local-health-preview', date);
  return {
    steps: valueFor(samples, 'steps'),
    activeEnergyKcal: valueFor(samples, 'calories'),
    exerciseMinutes: valueFor(samples, 'workout'),
    sleepMinutes: valueFor(samples, 'sleep'),
    mindfulMinutes: valueFor(samples, 'mindfulness'),
    source: 'apple_health',
    syncedAt: new Date().toISOString(),
  };
}
