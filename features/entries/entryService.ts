import { decode } from 'base64-arraybuffer';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

import { STORAGE_BUCKETS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import {
  clearEntryInsertError,
  clearStorageUploadError,
  noteEntryInsertError,
  noteStorageUploadError,
  noteVerification,
} from '@/features/dev/diagnosticsStore';
import {
  buildProofMetadata,
  entryTypeFromPersisted,
  persistedEntryTypeForProof,
  scoreTrustFromMetadata,
  trustLevelForProof,
  trustWeightForLevel,
  verificationMethodForProof,
  isEntryRankedEligible,
} from '@/features/entries/proofPolicy';
import { canSpendProof, spendProofForEntry } from '@/features/proofs/proofService';
import { scoreEntry, type ScoreEntryResult } from '@/features/scoring/scoringService';
import { getEntryDisplayScore } from '@/features/scoring/basicScoring';
import type {
  CreateManualEntryInput,
  CreatePhotoEntryInput,
  DailyScore,
  Entry,
  EntryDaySummary,
  EntryMedia,
  EntryScore,
  EntryVisibility,
  EntryWithScore,
  PersistedEntryType,
  ProofType,
  WellnessPillar,
} from '@/features/entries/types';

type EntryRow = {
  id: string;
  user_id: string;
  entry_type: PersistedEntryType;
  activity_tag: string | null;
  caption: string | null;
  location_name: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  wellness_pillar: WellnessPillar | null;
  visibility: EntryVisibility;
  status: Entry['status'];
  occurred_at: string;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

type EntryScoreRow = {
  entry_id: string;
  user_id: string;
  normalized_activity: string;
  wellness_pillar: WellnessPillar;
  points: number;
  base_points: number;
  bonus_points: number;
  confidence: number | string;
  scoring_source: EntryScore['scoringSource'];
  ai_subtext: string | null;
  scoring_explanation: string | null;
  model_name: string | null;
  flagged: boolean;
  flag_reason: string | null;
  metadata: unknown;
  scored_at: string;
  updated_at: string;
};

type EntryMediaRow = {
  id: string;
  entry_id: string;
  user_id: string;
  bucket_id: 'entry-photos';
  storage_path: string;
  media_kind: EntryMedia['mediaKind'];
  mime_type: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
};

type DailyScoreRow = {
  id: string;
  user_id: string;
  score_date: string;
  total_points: number;
  movement_points: number;
  fuel_points: number;
  mind_points: number;
  recovery_points: number;
  completed_pillars: number;
  all_pillars_completed: boolean;
  streak_count: number;
  rank_snapshot: number | null;
  created_at: string;
  updated_at: string;
};

type UploadEntryPhotoInput = {
  userId: string;
  entryId: string;
  uri: string;
  mimeType?: string | null;
  base64?: string | null;
  width?: number | null;
  height?: number | null;
};

const ONE_HOUR = 60 * 60;

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

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateWindow(date: string | Date) {
  const key = typeof date === 'string' ? date.slice(0, 10) : dateKeyFromDate(date);
  const [year, month, day] = key.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { key, start: start.toISOString(), end: end.toISOString() };
}

function normalizeOptional(value?: string | null, maxLength = 1000) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function shouldSpendProof(metadata?: Record<string, unknown>) {
  const consumption = metadata?.proof_consumption;
  return consumption !== 'free' && consumption !== 'system' && metadata?.free_proof !== true;
}

function shouldRequestScore(metadata?: Record<string, unknown>) {
  return metadata?.score_requested !== false;
}

function mapEntry(row: EntryRow): Entry {
  const metadata = asRecord(row.metadata);
  return {
    id: row.id,
    userId: row.user_id,
    entryType: entryTypeFromPersisted(row.entry_type, metadata),
    activityTag: row.activity_tag,
    caption: row.caption,
    locationName: row.location_name,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    wellnessPillar: row.wellness_pillar,
    visibility: row.visibility,
    status: row.status,
    occurredAt: row.occurred_at,
    metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapScore(row: EntryScoreRow): EntryScore {
  const metadata = asRecord(row.metadata);
  const trust = scoreTrustFromMetadata(metadata);
  return {
    entryId: row.entry_id,
    userId: row.user_id,
    normalizedActivity: row.normalized_activity,
    wellnessPillar: row.wellness_pillar,
    points: Number(row.points ?? 0),
    basePoints: Number(row.base_points ?? 0),
    bonusPoints: Number(row.bonus_points ?? 0),
    confidence: Number(row.confidence ?? 0),
    scoringSource: row.scoring_source,
    ...trust,
    aiSubtext: row.ai_subtext,
    scoringExplanation: row.scoring_explanation,
    modelName: row.model_name,
    flagged: row.flagged,
    flagReason: row.flag_reason,
    metadata,
    scoredAt: row.scored_at,
    updatedAt: row.updated_at,
  };
}

function objectPathFromStoragePath(storagePath: string) {
  const prefix = `${STORAGE_BUCKETS.entryProofs}/`;
  return storagePath.startsWith(prefix) ? storagePath.slice(prefix.length) : storagePath;
}

function mapMedia(row: EntryMediaRow, signedUrl: string | null = null): EntryMedia {
  return {
    id: row.id,
    entryId: row.entry_id,
    userId: row.user_id,
    bucketId: row.bucket_id,
    storagePath: row.storage_path,
    objectPath: objectPathFromStoragePath(row.storage_path),
    signedUrl,
    mediaKind: row.media_kind,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
}

function mapDailyScore(row: DailyScoreRow): DailyScore {
  return {
    id: row.id,
    userId: row.user_id,
    scoreDate: row.score_date,
    totalPoints: row.total_points,
    movementPoints: row.movement_points,
    fuelPoints: row.fuel_points,
    mindPoints: row.mind_points,
    recoveryPoints: row.recovery_points,
    completedPillars: row.completed_pillars,
    allPillarsCompleted: row.all_pillars_completed,
    streakCount: row.streak_count,
    rankSnapshot: row.rank_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('You must be signed in to create an entry.');
  }
  return data.user.id;
}

async function assertOwnUser(userId: string) {
  const authUserId = await getAuthenticatedUserId();
  if (authUserId !== userId) {
    throw new Error('Entry user must match the signed-in user.');
  }
}

async function getSignedMedia(row: EntryMediaRow) {
  const objectPath = objectPathFromStoragePath(row.storage_path);
  const { data } = await supabase.storage
    .from(STORAGE_BUCKETS.entryProofs)
    .createSignedUrl(objectPath, ONE_HOUR);

  return mapMedia(row, data?.signedUrl ?? null);
}

async function hydrateEntryRows(rows: EntryRow[]): Promise<EntryWithScore[]> {
  if (rows.length === 0) {
    return [];
  }

  const entryIds = rows.map((row) => row.id);
  const [scoresResult, mediaResult] = await Promise.all([
    supabase.from('entry_scores').select('*').in('entry_id', entryIds),
    supabase.from('entry_media').select('*').in('entry_id', entryIds).order('created_at'),
  ]);

  if (scoresResult.error) {
    throw scoresResult.error;
  }
  if (mediaResult.error) {
    throw mediaResult.error;
  }

  const scoreByEntryId = new Map(
    ((scoresResult.data ?? []) as EntryScoreRow[]).map((row) => [row.entry_id, mapScore(row)]),
  );
  const mediaRowsByEntryId = new Map<string, EntryMediaRow[]>();
  for (const row of (mediaResult.data ?? []) as EntryMediaRow[]) {
    mediaRowsByEntryId.set(row.entry_id, [...(mediaRowsByEntryId.get(row.entry_id) ?? []), row]);
  }

  const mediaByEntryId = new Map<string, EntryMedia[]>();
  await Promise.all(
    [...mediaRowsByEntryId.entries()].map(async ([entryId, mediaRows]) => {
      mediaByEntryId.set(entryId, await Promise.all(mediaRows.map(getSignedMedia)));
    }),
  );

  return rows.map((row) => {
    const entry = mapEntry(row);
    const score = scoreByEntryId.get(row.id);
    const hydratedScore =
      score && !score.metadata.proof_type
        ? {
            ...score,
            ...scoreTrustFromMetadata(entry.metadata),
            metadata: { ...entry.metadata, ...score.metadata },
          }
        : score;

    return {
      ...entry,
      score: hydratedScore ?? null,
      media: mediaByEntryId.get(row.id) ?? [],
    };
  });
}

export async function getEntriesForDate(userId: string, date: string | Date) {
  const { start, end } = dateWindow(date);
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .gte('occurred_at', start)
    .lt('occurred_at', end)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw error;
  }

  return hydrateEntryRows((data ?? []) as EntryRow[]);
}

export async function getTodayEntries(userId: string) {
  return getEntriesForDate(userId, new Date());
}

export async function listRecentEntries(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return hydrateEntryRows((data ?? []) as EntryRow[]);
}

export async function getDailyScoreForDate(userId: string, date: string | Date) {
  const { key } = dateWindow(date);
  const { data, error } = await supabase
    .from('daily_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('score_date', key)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapDailyScore(data as DailyScoreRow) : null;
}

export async function getEntryWithScore(entryId: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .neq('status', 'deleted')
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Entry not found.');
  }

  const [entry] = await hydrateEntryRows([data as EntryRow]);
  return entry;
}

export async function requestEntryScore(entryId: string): Promise<ScoreEntryResult> {
  return scoreEntry(entryId);
}

export async function createManualEntry(input: CreateManualEntryInput) {
  await assertOwnUser(input.userId);

  const activityTag = normalizeOptional(input.activityTag, 120);
  if (!activityTag) {
    throw new Error('Pick or enter an activity before submitting.');
  }

  const proofType: ProofType = input.proofType ?? 'manual_note';
  const trustLevel = input.trustLevel ?? trustLevelForProof(proofType);
  const verificationMethod = input.verificationMethod ?? verificationMethodForProof(proofType);
  const proofMetadata = buildProofMetadata({
    proofType,
    verificationMethod,
    trustLevel,
    rankedEligible: input.rankedEligible,
    scoreRequested: input.scoreRequested ?? proofType !== 'manual_note',
    consumesDailyProof: input.consumesDailyProof ?? proofType !== 'manual_note',
  });
  const metadata = {
    ...(input.metadata ?? {}),
    ...proofMetadata,
    entry_engine_version: 1,
    capture_surface: proofType === 'manual_note' ? 'manual_note' : 'quick_proof',
  };
  const consumesProof = shouldSpendProof(metadata);
  const scoreRequested = shouldRequestScore(metadata);
  if (consumesProof) {
    const proofCheck = await canSpendProof(input.userId);
    if (!proofCheck.canSpend) {
      throw new Error(proofCheck.reason ?? "You're out of Daily Proofs.");
    }
  }

  const entryId = Crypto.randomUUID();
  const { error } = await supabase
    .from('entries')
    .insert({
      id: entryId,
      user_id: input.userId,
      entry_type: persistedEntryTypeForProof(proofType),
      activity_tag: activityTag,
      caption: normalizeOptional(input.caption),
      location_name: normalizeOptional(input.locationName, 120),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      wellness_pillar: input.wellnessPillar ?? null,
      visibility: input.visibility ?? 'friends',
      status: scoreRequested ? 'pending_score' : 'draft',
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      metadata,
    });

  if (error) {
    noteEntryInsertError(error);
    throw error;
  }

  if (consumesProof) {
    try {
      await spendProofForEntry(entryId);
    } catch (proofError) {
      await supabase.from('entries').delete().eq('id', entryId).eq('user_id', input.userId);
      noteEntryInsertError(proofError);
      throw proofError;
    }
  }

  noteVerification({
    method: verificationMethod,
    trust: `${trustLevel}:${trustWeightForLevel(trustLevel)}`,
  });
  if (scoreRequested) {
    await requestEntryScore(entryId);
  }
  clearEntryInsertError();
  return getEntryWithScore(entryId);
}

function imageExtension(mimeType?: string | null) {
  return mimeType?.toLowerCase().includes('png') ? 'png' : 'jpg';
}

function imageMimeType(extension: string, mimeType?: string | null) {
  if (extension === 'png') {
    return 'image/png';
  }
  return mimeType?.toLowerCase().includes('jpeg') ? 'image/jpeg' : 'image/jpeg';
}

function cleanBase64(value: string) {
  return value.includes(',') ? value.split(',').pop() ?? value : value;
}

export async function uploadEntryPhoto(input: UploadEntryPhotoInput) {
  await assertOwnUser(input.userId);

  const extension = imageExtension(input.mimeType);
  const mimeType = imageMimeType(extension, input.mimeType);
  const mediaId = Crypto.randomUUID();
  const objectPath = `${input.userId}/${input.entryId}/${mediaId}.${extension}`;
  const storagePath = `${STORAGE_BUCKETS.entryProofs}/${objectPath}`;

  const mediaRow: EntryMediaRow = {
    id: mediaId,
    entry_id: input.entryId,
    user_id: input.userId,
    bucket_id: STORAGE_BUCKETS.entryProofs,
    storage_path: storagePath,
    media_kind: 'proof',
    mime_type: mimeType,
    width: input.width ?? null,
    height: input.height ?? null,
    created_at: new Date().toISOString(),
  };

  const { error: mediaError } = await supabase
    .from('entry_media')
    .insert({
      id: mediaId,
      entry_id: input.entryId,
      user_id: input.userId,
      bucket_id: STORAGE_BUCKETS.entryProofs,
      storage_path: storagePath,
      media_kind: 'proof',
      mime_type: mimeType,
      width: input.width ?? null,
      height: input.height ?? null,
    });

  if (mediaError) {
    noteEntryInsertError(mediaError);
    throw mediaError;
  }

  try {
    const base64 =
      input.base64 ??
      (await FileSystem.readAsStringAsync(input.uri, {
        encoding: FileSystem.EncodingType.Base64,
      }));

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.entryProofs)
      .upload(objectPath, decode(cleanBase64(base64)), {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }
  } catch (uploadError) {
    await supabase.from('entry_media').delete().eq('id', mediaId).eq('user_id', input.userId);
    noteStorageUploadError(uploadError);
    noteEntryInsertError(uploadError);
    throw uploadError;
  }

  clearStorageUploadError();
  return getSignedMedia(mediaRow);
}

export async function createPhotoEntry(input: CreatePhotoEntryInput) {
  await assertOwnUser(input.userId);

  const activityTag = normalizeOptional(input.activityTag, 120);
  if (!activityTag) {
    throw new Error('Add an activity before submitting photo proof.');
  }

  const proofType: ProofType = input.proofType ?? 'photo';
  const trustLevel = input.trustLevel ?? trustLevelForProof(proofType);
  const verificationMethod = input.verificationMethod ?? verificationMethodForProof(proofType);
  const metadata = {
    ...(input.metadata ?? {}),
    ...buildProofMetadata({
      proofType,
      verificationMethod,
      trustLevel,
      rankedEligible: input.rankedEligible,
      scoreRequested: input.scoreRequested ?? true,
      consumesDailyProof: input.consumesDailyProof ?? true,
    }),
    entry_engine_version: 1,
    capture_surface: proofType === 'hybrid' ? 'hybrid_photo_proof' : 'photo_proof',
  };
  const consumesProof = shouldSpendProof(metadata);
  const scoreRequested = shouldRequestScore(metadata);
  if (consumesProof) {
    const proofCheck = await canSpendProof(input.userId);
    if (!proofCheck.canSpend) {
      throw new Error(proofCheck.reason ?? "You're out of Daily Proofs.");
    }
  }

  const entryId = Crypto.randomUUID();
  const { error } = await supabase
    .from('entries')
    .insert({
      id: entryId,
      user_id: input.userId,
      entry_type: 'photo',
      activity_tag: activityTag,
      caption: normalizeOptional(input.caption),
      location_name: normalizeOptional(input.locationName, 120),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      wellness_pillar: input.wellnessPillar ?? null,
      visibility: input.visibility ?? 'friends',
      status: scoreRequested ? 'pending_score' : 'draft',
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      metadata,
    });

  if (error) {
    noteEntryInsertError(error);
    throw error;
  }

  let uploadedMedia: EntryMedia;
  try {
    uploadedMedia = await uploadEntryPhoto({
      userId: input.userId,
      entryId,
      uri: input.uri,
      mimeType: input.mimeType,
      base64: input.base64,
      width: input.width,
      height: input.height,
    });
  } catch (uploadError) {
    await supabase.from('entries').delete().eq('id', entryId).eq('user_id', input.userId);
    noteEntryInsertError(uploadError);
    throw uploadError;
  }

  if (consumesProof) {
    try {
      await spendProofForEntry(entryId);
    } catch (proofError) {
      await supabase.storage
        .from(STORAGE_BUCKETS.entryProofs)
        .remove([uploadedMedia.objectPath])
        .catch(() => undefined);
      await supabase.from('entries').delete().eq('id', entryId).eq('user_id', input.userId);
      noteEntryInsertError(proofError);
      throw proofError;
    }
  }

  noteVerification({
    method: verificationMethod,
    trust: `${trustLevel}:${trustWeightForLevel(trustLevel)}`,
  });
  if (scoreRequested) {
    await requestEntryScore(entryId);
  }
  clearEntryInsertError();
  clearStorageUploadError();
  return getEntryWithScore(entryId);
}

export function summarizeEntryDay(
  entries: EntryWithScore[],
  dailyScore?: DailyScore | null,
): EntryDaySummary {
  const derived = entries.reduce<Record<WellnessPillar, number>>(
    (totals, entry) => {
      if (!isEntryRankedEligible(entry)) {
        return totals;
      }
      const pillar = entry.score?.wellnessPillar ?? entry.wellnessPillar;
      const displayScore = getEntryDisplayScore(entry);
      if (pillar && displayScore.points) {
        totals[pillar] += displayScore.points;
      }
      return totals;
    },
    { movement: 0, fuel: 0, mind: 0, recovery: 0 },
  );

  const pillars = dailyScore
    ? {
        movement: dailyScore.movementPoints,
        fuel: dailyScore.fuelPoints,
        mind: dailyScore.mindPoints,
        recovery: dailyScore.recoveryPoints,
      }
    : derived;
  const completedPillars = (Object.keys(pillars) as WellnessPillar[]).filter(
    (pillar) => pillars[pillar] > 0,
  );

  return {
    totalPoints: dailyScore
      ? dailyScore.totalPoints
      : Object.values(derived).reduce((total, points) => total + points, 0),
    source: dailyScore ? 'daily_score' : 'entry_scores',
    pillars,
    completedPillars,
    pendingCount: entries.filter(
      (entry) => isEntryRankedEligible(entry) && getEntryDisplayScore(entry).pending,
    ).length,
  };
}
