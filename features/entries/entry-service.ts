import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { STORAGE_BUCKETS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { mapEntry } from '@/features/entries/entry-mappers';
import { scoreEntry, type ScoreEntryPayload } from '@/features/scoring/scoring-service';
import type { Entry, HealthMetricSnapshot, WellnessPillar } from '@/types/domain';

export type CreateManualEntryInput = {
  pillar: WellnessPillar;
  actionType: string;
  title: string;
  caption?: string;
  occurredAt?: string;
  healthSnapshot?: HealthMetricSnapshot | null;
  location?: Record<string, unknown> | null;
};

export type CreatePhotoEntryInput = CreateManualEntryInput & {
  userId: string;
  localUri: string;
};

export async function listEntries(limit = 30) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return Promise.all((data ?? []).map((row) => hydrateProofUrl(mapEntry(row))));
}

export async function getEntry(id: string) {
  const { data, error } = await supabase.from('entries').select('*').eq('id', id).single();

  if (error) {
    throw error;
  }

  return hydrateProofUrl(mapEntry(data));
}

export async function listEntriesForDate(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(`${dateKey}T23:59:59`);

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .gte('occurred_at', start.toISOString())
    .lte('occurred_at', end.toISOString())
    .order('occurred_at', { ascending: false });

  if (error) {
    throw error;
  }

  return Promise.all((data ?? []).map((row) => hydrateProofUrl(mapEntry(row))));
}

export async function hydrateProofUrl(entry: Entry) {
  if (!entry.proofUrl || entry.proofUrl.startsWith('http')) {
    return entry;
  }

  const { data } = await supabase.storage
    .from(STORAGE_BUCKETS.entryProofs)
    .createSignedUrl(entry.proofUrl, 60 * 60);

  return {
    ...entry,
    proofUrl: data?.signedUrl ?? entry.proofUrl,
  };
}

export async function uploadEntryProof(userId: string, localUri: string) {
  const extension = localUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `${userId}/${Date.now()}.${extension}`;
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.entryProofs)
    .upload(path, decode(base64), {
      contentType: extension === 'png' ? 'image/png' : 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return path;
}

export async function createManualEntry(input: CreateManualEntryInput) {
  const payload: ScoreEntryPayload = {
    source: input.healthSnapshot ? 'healthkit' : 'manual',
    pillar: input.pillar,
    actionType: input.actionType,
    title: input.title,
    caption: input.caption,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    healthSnapshot: input.healthSnapshot,
    location: input.location,
    clientMetadata: {
      captureSurface: 'manual_check_in',
    },
  };

  return hydrateProofUrl(await scoreEntry(payload));
}

export async function createPhotoEntry(input: CreatePhotoEntryInput) {
  const proofPath = await uploadEntryProof(input.userId, input.localUri);
  return hydrateProofUrl(await scoreEntry({
    source: 'photo',
    pillar: input.pillar,
    actionType: input.actionType,
    title: input.title,
    caption: input.caption,
    proofPath,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    location: input.location,
    healthSnapshot: input.healthSnapshot,
    clientMetadata: {
      captureSurface: 'camera',
      originalUriScheme: input.localUri.split(':')[0],
    },
  }));
}

export function summarizeEntries(entries: Entry[]) {
  const score = entries.reduce((total, entry) => total + entry.score, 0);
  const completedPillars = new Set(entries.map((entry) => entry.pillar));
  const scored = entries.filter((entry) => entry.status === 'scored');

  return {
    score,
    entries: entries.length,
    scoredEntries: scored.length,
    completedPillars,
  };
}
