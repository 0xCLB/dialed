import { supabase } from '@/lib/supabase';
import { noteScoringError, noteVerification } from '@/features/dev/diagnosticsStore';
import {
  getEntryProofType,
  getEntryTrustLevel,
  getEntryTrustWeight,
  isEntryRankedEligible,
  isManualNote,
} from '@/features/entries/proofPolicy';
import { isFoodProof } from '@/features/food/foodAnalysisService';
import { analyzeFoodPhoto, fallbackFoodAnalysis } from '@/features/scoring/foodAnalysisService';
import { scoreHealthSample } from '@/features/health/healthScoringService';
import type { EntryScore, EntryWithScore, WellnessPillar } from '@/features/entries/types';
import type { HealthMetricType, HealthSample } from '@/features/health/types';
import type {
  ProofType as ScoringProofType,
  ScoreResult,
  ScoringSource,
  ScoringStatus,
  TrustLevel,
} from '@/features/scoring/types';

export type ScoreEntryResponse = {
  entry_id: string;
  normalized_activity: string;
  wellness_pillar: WellnessPillar;
  base_points: number;
  bonus_points: number;
  total_points: number;
  confidence: number;
  ai_subtext: string;
  flagged: boolean;
  flag_reason?: string;
  scoring_explanation: string;
};

export type ScoreEntryResult =
  | {
      ok: true;
      data: ScoreEntryResponse;
    }
  | {
      ok: false;
      reason: 'not_deployed' | 'network' | 'auth' | 'server' | 'unknown';
      message: string;
      status?: number;
    };

type ScoreEntryFailure = Extract<ScoreEntryResult, { ok: false }>;

type EntryScoreRow = {
  entry_id: string;
  normalized_activity: string;
  wellness_pillar: WellnessPillar;
  points: number;
  base_points: number;
  bonus_points: number;
  confidence: number | string;
  scoring_source: EntryScore['scoringSource'];
  ai_subtext: string | null;
  scoring_explanation: string | null;
  metadata: unknown;
};

const TRUST_CONFIDENCE: Record<TrustLevel, number> = {
  verified_health: 1,
  photo_ai: 0.85,
  photo_location: 0.95,
  location_only: 0.65,
  manual_note: 0.15,
  pending: 0.1,
};

const TRUST_WEIGHT: Record<TrustLevel, number> = {
  verified_health: 1,
  photo_ai: 0.85,
  photo_location: 0.95,
  location_only: 0.65,
  manual_note: 0.15,
  pending: 0,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberOr(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function scoringSource(value: EntryScore['scoringSource']): ScoringSource {
  if (value === 'health') return 'health';
  if (value === 'rule') return 'rule';
  return 'edge_function';
}

function scoringProofType(entry: Pick<EntryWithScore, 'entryType' | 'metadata' | 'activityTag'>): ScoringProofType {
  if (isFoodProof(entry)) return 'food_photo';
  return getEntryProofType(entry) as ScoringProofType;
}

function scoringTrustLevel(entry: Pick<EntryWithScore, 'entryType' | 'metadata'>): TrustLevel {
  return getEntryTrustLevel(entry) as TrustLevel;
}

function activityText(entry: Pick<EntryWithScore, 'activityTag' | 'caption'>) {
  return `${entry.activityTag ?? ''} ${entry.caption ?? ''}`.toLowerCase();
}

function fallbackPillar(entry: Pick<EntryWithScore, 'wellnessPillar' | 'activityTag' | 'caption'>): WellnessPillar {
  if (entry.wellnessPillar) return entry.wellnessPillar;
  const text = activityText(entry);
  if (/protein|meal|breakfast|lunch|dinner|water|hydration|fuel|food|salad/.test(text)) return 'fuel';
  if (/read|meditat|mindful|journal|focus|breath/.test(text)) return 'mind';
  if (/sleep|sauna|stretch|mobility|yoga|recovery|cold plunge/.test(text)) return 'recovery';
  return 'movement';
}

function basePointsForActivity(entry: Pick<EntryWithScore, 'activityTag' | 'caption' | 'wellnessPillar'>) {
  const text = activityText(entry);
  const pillar = fallbackPillar(entry);

  if (/gym|lift|weights?|training|workout/.test(text)) return 28;
  if (/run|hike|cycle|bike|sport/.test(text)) return 24;
  if (/walk|steps?/.test(text)) return 12;

  if (/water|hydration|electrolyte/.test(text)) return 7;
  if (/protein/.test(text)) return 16;
  if (/meal|breakfast|lunch|dinner|salad|bowl|food/.test(text)) return 14;

  if (/read|reading|study/.test(text)) return 10;
  if (/meditat|mindful|breath/.test(text)) return 14;

  if (/sleep/.test(text)) return 22;
  if (/sauna|cold plunge|ice bath/.test(text)) return 16;
  if (/stretch|mobility|yoga/.test(text)) return 12;

  if (pillar === 'fuel') return 10;
  if (pillar === 'mind') return 8;
  if (pillar === 'recovery') return 10;
  return 12;
}

function normalizedActivity(entry: Pick<EntryWithScore, 'activityTag'>) {
  return entry.activityTag?.replace(/[_-]+/g, ' ') ?? 'proof';
}

function buildRuleScore({
  entry,
  proofType,
  trustLevel,
  basePoints,
  bonusPoints = 0,
  explanation,
  source = 'rule',
  status = 'fallback',
}: {
  entry: EntryWithScore;
  proofType: ScoringProofType;
  trustLevel: TrustLevel;
  basePoints: number;
  bonusPoints?: number;
  explanation: string;
  source?: ScoringSource;
  status?: ScoringStatus;
}): ScoreResult {
  const confidence = TRUST_CONFIDENCE[trustLevel];
  const trustWeight = TRUST_WEIGHT[trustLevel];
  const points =
    proofType === 'manual_note'
      ? Math.min(3, Math.max(0, Math.round(basePoints)))
      : Math.max(0, Math.round((basePoints + bonusPoints) * trustWeight));

  return {
    entryId: entry.id,
    proofType,
    trustLevel,
    wellnessPillar: fallbackPillar(entry),
    points,
    basePoints,
    bonusPoints,
    confidence,
    explanation,
    status,
    source,
    rankedEligible: proofType !== 'manual_note' && isEntryRankedEligible(entry),
    normalizedActivity: normalizedActivity(entry),
    subtext:
      proofType === 'manual_note'
        ? 'Manual note saved for context. Verified proofs move ranked score.'
        : 'Basic score is live. Proof Analysis can refine it later.',
    metadata: {
      proof_type: proofType,
      trust_level: trustLevel,
      trust_weight: trustWeight,
    },
  };
}

function rowToScoreResult(row: EntryScoreRow): ScoreResult {
  const metadata = asRecord(row.metadata);
  const proofType = (metadata.proof_type === 'food_photo'
    ? 'food_photo'
    : metadata.proof_type === 'location'
    ? 'location'
    : metadata.proof_type === 'health'
    ? 'health'
    : metadata.proof_type === 'hybrid'
    ? 'hybrid'
    : metadata.proof_type === 'manual_note'
    ? 'manual_note'
    : 'photo') as ScoringProofType;
  const trustLevel = (metadata.trust_level === 'verified_health' ||
  metadata.trust_level === 'photo_ai' ||
  metadata.trust_level === 'photo_location' ||
  metadata.trust_level === 'location_only' ||
  metadata.trust_level === 'manual_note'
    ? metadata.trust_level
    : proofType === 'health'
    ? 'verified_health'
    : proofType === 'location'
    ? 'location_only'
    : proofType === 'manual_note'
    ? 'manual_note'
    : 'photo_ai') as TrustLevel;

  return {
    entryId: row.entry_id,
    proofType,
    trustLevel,
    wellnessPillar: row.wellness_pillar,
    points: Number(row.points ?? 0),
    basePoints: Number(row.base_points ?? 0),
    bonusPoints: Number(row.bonus_points ?? 0),
    confidence: numberOr(row.confidence, TRUST_CONFIDENCE[trustLevel]),
    explanation: row.scoring_explanation ?? 'Proof Analysis scored this entry.',
    status: 'scored',
    source: scoringSource(row.scoring_source),
    rankedEligible: metadata.ranked_eligible !== false && proofType !== 'manual_note',
    normalizedActivity: row.normalized_activity,
    subtext: row.ai_subtext,
    metadata,
  };
}

function classifyFunctionError(error: unknown): ScoreEntryFailure {
  const message = error instanceof Error ? error.message : 'Scoring request failed.';
  const status =
    typeof error === 'object' && error && 'context' in error
      ? Number((error as { context?: { status?: unknown } }).context?.status)
      : undefined;
  const safeStatus = Number.isFinite(status) ? status : undefined;
  const lowerMessage = message.toLowerCase();

  if (safeStatus === 404 || lowerMessage.includes('not found')) {
    return {
      ok: false,
      reason: 'not_deployed',
      message: 'Scoring is queued. The score-entry function is not deployed yet.',
      status: safeStatus,
    };
  }

  if (safeStatus === 401 || safeStatus === 403 || lowerMessage.includes('unauthorized')) {
    return {
      ok: false,
      reason: 'auth',
      message: 'Scoring needs a valid signed-in session.',
      status: safeStatus,
    };
  }

  if (!safeStatus || lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return {
      ok: false,
      reason: 'network',
      message: 'Scoring could not be reached. Your entry is saved and waiting.',
      status: safeStatus,
    };
  }

  if (safeStatus >= 500) {
    return {
      ok: false,
      reason: 'server',
      message: 'Scoring is temporarily unavailable. Your entry is saved and waiting.',
      status: safeStatus,
    };
  }

  return {
    ok: false,
    reason: 'unknown',
    message,
    status: safeStatus,
  };
}

export async function scoreEntry(entryId: string): Promise<ScoreEntryResult> {
  try {
    const { data, error } = await supabase.functions.invoke<ScoreEntryResponse>('score-entry', {
      body: { entry_id: entryId },
    });

    if (error) {
      const result = classifyFunctionError(error);
      noteScoringError(result.message);
      return result;
    }

    if (!data?.entry_id) {
      noteScoringError('Scoring returned an empty response. Your entry is saved and waiting.');
      return {
        ok: false,
        reason: 'server',
        message: 'Scoring returned an empty response. Your entry is saved and waiting.',
      };
    }

    noteScoringError(null);
    noteVerification({ trust: `confidence:${data.confidence}` });
    return { ok: true, data };
  } catch (error) {
    const result = classifyFunctionError(error);
    noteScoringError(result.message);
    return result;
  }
}

export function normalizeScoreResult(result: ScoreResult | ScoreEntryResponse | EntryScore): ScoreResult {
  if ('proofType' in result) return result;

  if ('entryId' in result && 'normalizedActivity' in result) {
    const trustLevel = (result.trustLevel ?? 'photo_ai') as TrustLevel;
    return {
      entryId: result.entryId,
      proofType:
        result.metadata.proof_type === 'food_photo'
          ? 'food_photo'
          : result.metadata.proof_type === 'manual_note'
          ? 'manual_note'
          : result.metadata.proof_type === 'health'
          ? 'health'
          : result.metadata.proof_type === 'location'
          ? 'location'
          : result.metadata.proof_type === 'hybrid'
          ? 'hybrid'
          : 'photo',
      trustLevel,
      wellnessPillar: result.wellnessPillar,
      points: result.points,
      basePoints: result.basePoints,
      bonusPoints: result.bonusPoints,
      confidence: result.confidence,
      explanation: result.scoringExplanation ?? 'Proof Analysis scored this entry.',
      status: 'scored',
      source: scoringSource(result.scoringSource),
      rankedEligible: result.rankedEligible,
      normalizedActivity: result.normalizedActivity,
      subtext: result.aiSubtext,
      metadata: result.metadata,
    };
  }

  return {
    entryId: result.entry_id,
    proofType: 'photo',
    trustLevel: 'photo_ai',
    wellnessPillar: result.wellness_pillar,
    points: result.total_points,
    basePoints: result.base_points,
    bonusPoints: result.bonus_points,
    confidence: result.confidence,
    explanation: result.scoring_explanation,
    status: 'scored',
    source: 'edge_function',
    rankedEligible: true,
    normalizedActivity: result.normalized_activity,
    subtext: result.ai_subtext,
    metadata: {
      flagged: result.flagged,
      flag_reason: result.flag_reason,
    },
  };
}

export async function getCachedScore(entryId: string): Promise<ScoreResult | null> {
  const { data, error } = await supabase
    .from('entry_scores')
    .select('*')
    .eq('entry_id', entryId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? rowToScoreResult(data as EntryScoreRow) : null;
}

export async function saveFallbackScore(entryId: string, result: ScoreResult) {
  const { data, error } = await supabase
    .from('entries')
    .select('metadata')
    .eq('id', entryId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  const metadata = {
    ...asRecord((data as { metadata?: unknown }).metadata),
    fallback_score: {
      proof_type: result.proofType,
      trust_level: result.trustLevel,
      wellness_pillar: result.wellnessPillar,
      points: result.points,
      confidence: result.confidence,
      explanation: result.explanation,
      source: result.source,
      status: result.status,
      ranked_eligible: result.rankedEligible,
      saved_at: new Date().toISOString(),
    },
  };

  const { error: updateError } = await supabase
    .from('entries')
    .update({ metadata })
    .eq('id', entryId);

  return !updateError;
}

export async function scorePhotoProof(entry: EntryWithScore): Promise<ScoreResult> {
  const cached = await getCachedScore(entry.id).catch(() => null);
  if (cached) return cached;

  const basePoints = basePointsForActivity(entry);
  const result = buildRuleScore({
    entry,
    proofType: 'photo',
    trustLevel: 'photo_ai',
    basePoints,
    explanation: 'Photo classified with beta fallback rules. Server Proof Analysis can refine this later.',
  });
  await saveFallbackScore(entry.id, result).catch(() => false);
  return result;
}

export async function scoreFoodPhoto(entry: EntryWithScore): Promise<ScoreResult> {
  const cached = await getCachedScore(entry.id).catch(() => null);
  if (cached) return cached;

  const storagePath = entry.media.find((media) => media.mediaKind === 'proof')?.storagePath;
  const foodAnalysis = storagePath
    ? await analyzeFoodPhoto({ entryId: entry.id, storagePath, caption: entry.caption })
    : fallbackFoodAnalysis(entry.caption);
  const basePoints = foodAnalysis.suggestedPoints || basePointsForActivity(entry);
  const result = buildRuleScore({
    entry,
    proofType: 'food_photo',
    trustLevel: 'photo_ai',
    basePoints,
    explanation:
      foodAnalysis.status === 'scored'
        ? `Food Proof analyzed with ${Math.round(foodAnalysis.confidence * 100)}% confidence.`
        : 'Food Proof saved. Macro and Fuel quality analysis is pending.',
    source: foodAnalysis.source,
    status: foodAnalysis.status === 'scored' ? 'scored' : foodAnalysis.status,
  });
  const withFood = { ...result, foodAnalysis };
  await saveFallbackScore(entry.id, withFood).catch(() => false);
  return withFood;
}

export async function scoreLocationProof(entry: EntryWithScore): Promise<ScoreResult> {
  const cached = await getCachedScore(entry.id).catch(() => null);
  if (cached) return cached;

  const basePoints = Math.max(10, Math.round(basePointsForActivity(entry) * 0.8));
  const result = buildRuleScore({
    entry,
    proofType: 'location',
    trustLevel: 'location_only',
    basePoints,
    explanation: 'Location Proof uses medium-trust beta scoring until richer place classification is live.',
  });
  await saveFallbackScore(entry.id, result).catch(() => false);
  return result;
}

function healthMetricLabel(metricType?: HealthMetricType) {
  if (metricType === 'steps') return 'steps';
  if (metricType === 'workout') return 'workout minutes';
  if (metricType === 'mindfulness') return 'mindfulness minutes';
  if (metricType === 'sleep') return 'sleep';
  return 'health data';
}

function isHealthSample(value: HealthSample | EntryWithScore): value is HealthSample {
  return 'metricType' in value && 'provider' in value;
}

export async function scoreHealthProof(sampleOrEntry: HealthSample | EntryWithScore): Promise<ScoreResult> {
  if (isHealthSample(sampleOrEntry)) {
    const scored = scoreHealthSample(sampleOrEntry);
    return {
      entryId: sampleOrEntry.id ?? '',
      proofType: 'health',
      trustLevel: 'verified_health',
      wellnessPillar: scored.pillar,
      points: scored.points,
      basePoints: scored.basePoints,
      bonusPoints: scored.bonusPoints,
      confidence: 1,
      explanation: scored.explanation,
      status: 'scored',
      source: 'health',
      rankedEligible: true,
      normalizedActivity: healthMetricLabel(sampleOrEntry.metricType),
      subtext: 'Verified by Health.',
      metadata: {
        metric_type: sampleOrEntry.metricType,
        provider: sampleOrEntry.provider,
        unit: sampleOrEntry.unit,
      },
    };
  }

  const cached = await getCachedScore(sampleOrEntry.id).catch(() => null);
  if (cached) return cached;

  const preview = asRecord(sampleOrEntry.metadata.health_score_preview);
  const basePoints = numberOr(preview.points, basePointsForActivity(sampleOrEntry));
  const result = buildRuleScore({
    entry: sampleOrEntry,
    proofType: 'health',
    trustLevel: 'verified_health',
    basePoints,
    explanation:
      typeof preview.explanation === 'string'
        ? preview.explanation
        : 'Verified by Health with deterministic beta scoring.',
    source: 'health',
    status: 'scored',
  });
  await saveFallbackScore(sampleOrEntry.id, result).catch(() => false);
  return result;
}

export async function scoreHybridProof(entry: EntryWithScore): Promise<ScoreResult> {
  const cached = await getCachedScore(entry.id).catch(() => null);
  if (cached) return cached;

  const result = buildRuleScore({
    entry,
    proofType: 'hybrid',
    trustLevel: 'photo_location',
    basePoints: basePointsForActivity(entry),
    bonusPoints: 5,
    explanation: 'Hybrid Proof combines verification signals, so it earns a confidence bonus.',
  });
  await saveFallbackScore(entry.id, result).catch(() => false);
  return result;
}

export async function scoreManualNote(entry: EntryWithScore): Promise<ScoreResult> {
  const text = activityText(entry);
  const basePoints = text.length > 12 ? 2 : text.length > 0 ? 1 : 0;
  const result = buildRuleScore({
    entry,
    proofType: 'manual_note',
    trustLevel: 'manual_note',
    basePoints,
    explanation: 'Manual note saved for context. Verified proofs move ranked score.',
    status: 'fallback',
  });
  await saveFallbackScore(entry.id, result).catch(() => false);
  return result;
}

export function suggestClientScore({
  pillar,
  activityTag,
}: {
  pillar?: WellnessPillar | null;
  activityTag: string;
}) {
  const normalized = activityTag.toLowerCase();
  const premiumActions = ['gym', 'run', 'walk', 'protein', 'meditation', 'sauna', 'stretch'];
  const base = premiumActions.some((action) => normalized.includes(action)) ? 42 : 28;
  const pillarWeight = pillar === 'movement' || pillar === 'recovery' ? 1.08 : 1;

  return Math.round(base * pillarWeight);
}
