import {
  checkAppleHealthStatus,
  readAppleHealthSamplesForDate,
  requestAppleHealthPermissions,
} from '@/features/health/appleHealthService';
import type {
  HealthMetricType,
  HealthProvider,
  HealthSample,
  HealthSyncStatus,
  WearableProviderAdapter,
} from '@/features/health/types';
import { track } from '@/lib/analytics';

const APPLE_METRICS: HealthMetricType[] = [
  'steps',
  'workout',
  'calories',
  'sleep',
  'mindfulness',
];

const WEARABLE_STUBS: Array<{
  id: HealthProvider;
  label: string;
  metrics: HealthMetricType[];
  pro?: boolean;
}> = [
  { id: 'fitbit', label: 'Fitbit', metrics: ['steps', 'workout', 'sleep', 'heart_rate'] },
  { id: 'oura', label: 'Oura', metrics: ['sleep', 'hrv', 'recovery', 'heart_rate'], pro: true },
  { id: 'garmin', label: 'Garmin', metrics: ['steps', 'workout', 'sleep', 'heart_rate'], pro: true },
  { id: 'strava', label: 'Strava', metrics: ['workout'], pro: true },
  { id: 'whoop', label: 'WHOOP', metrics: ['sleep', 'hrv', 'recovery', 'heart_rate'], pro: true },
];

function comingSoonStatus(provider: HealthProvider, label: string): HealthSyncStatus {
  return {
    provider,
    available: false,
    connected: false,
    permissionGranted: false,
    lastSyncedAt: null,
    message: `${label} connector is staged for a later pass.`,
  };
}

export const appleHealthProvider: WearableProviderAdapter = {
  id: 'apple_health',
  label: 'Apple Health',
  connect: () => requestAppleHealthPermissions(),
  disconnect: async () => ({
    provider: 'apple_health',
    available: true,
    connected: false,
    permissionGranted: false,
    lastSyncedAt: null,
    message: 'Manage Apple Health permissions in iOS Settings.',
  }),
  getConnectionStatus: () => checkAppleHealthStatus(),
  syncToday: (userId) => readAppleHealthSamplesForDate(userId, new Date()),
  syncRange: async (userId, startDate, endDate) => {
    const samples: HealthSample[] = [];
    const cursor = new Date(startDate);
    const end = new Date(endDate);

    while (cursor <= end) {
      samples.push(...(await readAppleHealthSamplesForDate(userId, cursor)));
      cursor.setDate(cursor.getDate() + 1);
    }

    return samples;
  },
  normalizeSamples: (_raw, _userId) => [],
  supportsMetric: (metric) => APPLE_METRICS.includes(metric),
};

function createComingSoonProvider({
  id,
  label,
  metrics,
}: {
  id: HealthProvider;
  label: string;
  metrics: HealthMetricType[];
}): WearableProviderAdapter {
  return {
    id,
    label,
    connect: async () => {
      track('wearable_connector_clicked', { provider: id });
      return comingSoonStatus(id, label);
    },
    disconnect: async () => comingSoonStatus(id, label),
    getConnectionStatus: async () => comingSoonStatus(id, label),
    syncToday: async () => [],
    syncRange: async () => [],
    normalizeSamples: () => [],
    supportsMetric: (metric) => metrics.includes(metric),
  };
}

export const wearableProviderAdapters: WearableProviderAdapter[] = [
  appleHealthProvider,
  ...WEARABLE_STUBS.map(createComingSoonProvider),
];

export function getProviderAdapter(provider: HealthProvider) {
  return wearableProviderAdapters.find((adapter) => adapter.id === provider) ?? null;
}

export function getProviderMetadata(provider: HealthProvider) {
  if (provider === 'apple_health') {
    return {
      label: 'Apple Health',
      supportedMetrics: APPLE_METRICS,
      comingSoon: false,
      pro: false,
    };
  }

  const stub = WEARABLE_STUBS.find((item) => item.id === provider);
  return {
    label: stub?.label ?? provider,
    supportedMetrics: stub?.metrics ?? [],
    comingSoon: true,
    pro: Boolean(stub?.pro),
  };
}
