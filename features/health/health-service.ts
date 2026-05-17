import { format } from 'date-fns';

import { DATE_KEY_FORMAT } from '@/lib/constants';
import { getDailyHealthSnapshot, isAppleHealthAvailable } from '@/lib/healthkit';
import { supabase } from '@/lib/supabase';
import type { HealthMetricSnapshot } from '@/types/domain';

export async function syncTodayHealth(userId: string, date = new Date()) {
  const available = await isAppleHealthAvailable();
  if (!available) {
    throw new Error('Apple Health is only available on an iPhone build with HealthKit enabled.');
  }

  const snapshot = await getDailyHealthSnapshot(date);
  await upsertHealthSnapshot(userId, date, snapshot);
  return snapshot;
}

export async function upsertHealthSnapshot(
  userId: string,
  date: Date,
  snapshot: HealthMetricSnapshot,
) {
  const { error } = await supabase.from('health_sync_samples').upsert(
    {
      user_id: userId,
      day: format(date, DATE_KEY_FORMAT),
      metrics: snapshot,
      source: 'apple_health',
    },
    { onConflict: 'user_id,day,source' },
  );

  if (error) {
    throw error;
  }
}

export async function getLatestHealthSnapshot(userId: string) {
  const { data, error } = await supabase
    .from('health_sync_samples')
    .select('*')
    .eq('user_id', userId)
    .order('day', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.metrics ?? null) as HealthMetricSnapshot | null;
}
