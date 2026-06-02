import { supabase } from '@/lib/supabase';
import { noteFoodAnalysisError, noteScoringError } from '@/features/dev/diagnosticsStore';
import type { EntryWithScore } from '@/features/entries/types';
import type {
  AnalyzeFoodProofPayload,
  FoodAnalysis,
  FoodAnalysisResult,
  FuelQualityLabel,
} from '@/features/food/types';

type FoodAnalysisFailure = Extract<FoodAnalysisResult, { ok: false }>;

type FoodAnalysisRow = {
  id: string;
  entry_id: string;
  user_id: string;
  storage_path: string;
  detected_foods: unknown;
  estimated_calories: number | null;
  estimated_protein_g: number | string | null;
  estimated_carbs_g: number | string | null;
  estimated_fat_g: number | string | null;
  healthiness_score: number | null;
  fuel_quality_label: FuelQualityLabel | null;
  confidence: number | string | null;
  notes: string | null;
  suggested_points: number | null;
  warning: string | null;
  model_name: string | null;
  created_at: string;
  updated_at: string;
};

type EdgeFoodAnalysisResponse = Partial<{
  id: string;
  entry_id: string;
  user_id: string;
  storage_path: string;
  detected_foods: unknown;
  estimated_calories: number;
  estimated_protein_g: number;
  estimated_carbs_g: number;
  estimated_fat_g: number;
  healthiness_score: number;
  fuel_quality_label: FuelQualityLabel;
  confidence: number;
  notes: string;
  suggested_points: number;
  warning: string;
  model_name: string;
  analysis: FoodAnalysisRow;
}>;

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function detectedFoods(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (value && typeof value === 'object' && Array.isArray((value as { foods?: unknown[] }).foods)) {
    return (value as { foods: unknown[] }).foods.map((item) => String(item)).filter(Boolean);
  }
  return [];
}

function mapFoodAnalysis(row: FoodAnalysisRow, source: FoodAnalysis['source'] = 'cached'): FoodAnalysis {
  return {
    id: row.id,
    entryId: row.entry_id,
    userId: row.user_id,
    storagePath: row.storage_path,
    detectedFoods: detectedFoods(row.detected_foods),
    estimatedCalories: numberOrNull(row.estimated_calories),
    estimatedProteinG: numberOrNull(row.estimated_protein_g),
    estimatedCarbsG: numberOrNull(row.estimated_carbs_g),
    estimatedFatG: numberOrNull(row.estimated_fat_g),
    healthinessScore: numberOrNull(row.healthiness_score),
    fuelQualityLabel: row.fuel_quality_label,
    confidence: numberOrNull(row.confidence),
    notes: row.notes,
    suggestedPoints: numberOrNull(row.suggested_points),
    warning: row.warning,
    modelName: row.model_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source,
  };
}

function setupMissing(error: unknown) {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message)
      : String(error ?? '');
  const lower = message.toLowerCase();
  return (
    code === 'PGRST202' ||
    code === 'PGRST205' ||
    lower.includes('food_analyses') ||
    lower.includes('does not exist') ||
    lower.includes('could not find the table')
  );
}

function classifyFunctionError(error: unknown): FoodAnalysisFailure {
  const message = error instanceof Error ? error.message : 'Food analysis is pending.';
  const status =
    typeof error === 'object' && error && 'context' in error
      ? Number((error as { context?: { status?: unknown } }).context?.status)
      : undefined;
  const safeStatus = Number.isFinite(status) ? status : undefined;
  const lower = message.toLowerCase();

  if (safeStatus === 404 || lower.includes('not found')) {
    return {
      ok: false,
      status: 'not_deployed',
      message: 'Food analysis pending. The analyze-food-proof function is not deployed yet.',
    };
  }
  if (safeStatus === 401 || safeStatus === 403 || lower.includes('unauthorized')) {
    return {
      ok: false,
      status: 'auth',
      message: 'Food analysis needs a valid signed-in session.',
    };
  }
  if (!safeStatus || lower.includes('network') || lower.includes('fetch')) {
    return {
      ok: false,
      status: 'network',
      message: 'Food analysis could not be reached. Your proof is saved.',
    };
  }
  return {
    ok: false,
    status: 'server',
    message,
  };
}

function edgeResponseToRow(
  data: EdgeFoodAnalysisResponse,
  fallback: AnalyzeFoodProofPayload,
): FoodAnalysisRow | null {
  if (data.analysis) return data.analysis;
  const hasAnalysisFields =
    data.detected_foods !== undefined ||
    data.estimated_calories !== undefined ||
    data.healthiness_score !== undefined ||
    data.fuel_quality_label !== undefined;
  if (!data.entry_id && !hasAnalysisFields) return null;

  return {
    id: data.id ?? `${fallback.entry_id}:food-analysis`,
    entry_id: data.entry_id ?? fallback.entry_id,
    user_id: data.user_id ?? fallback.user_id ?? '',
    storage_path: data.storage_path ?? fallback.storage_path,
    detected_foods: data.detected_foods ?? [],
    estimated_calories: data.estimated_calories ?? null,
    estimated_protein_g: data.estimated_protein_g ?? null,
    estimated_carbs_g: data.estimated_carbs_g ?? null,
    estimated_fat_g: data.estimated_fat_g ?? null,
    healthiness_score: data.healthiness_score ?? null,
    fuel_quality_label: data.fuel_quality_label ?? null,
    confidence: data.confidence ?? null,
    notes: data.notes ?? null,
    suggested_points: data.suggested_points ?? null,
    warning: data.warning ?? null,
    model_name: data.model_name ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function isFoodProof(entry: Pick<EntryWithScore, 'metadata' | 'activityTag'>) {
  return (
    entry.metadata.food_proof === true ||
    entry.metadata.proof_subtype === 'food' ||
    entry.activityTag === 'food_photo'
  );
}

export async function getFoodAnalysisForEntry(entryId: string) {
  const { data, error } = await supabase
    .from('food_analyses')
    .select('*')
    .eq('entry_id', entryId)
    .maybeSingle();

  if (error) {
    if (setupMissing(error)) return null;
    throw error;
  }
  return data ? mapFoodAnalysis(data as FoodAnalysisRow) : null;
}

export async function getFoodAnalysisForStoragePath(storagePath: string) {
  const { data, error } = await supabase
    .from('food_analyses')
    .select('*')
    .eq('storage_path', storagePath)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (setupMissing(error)) return null;
    throw error;
  }
  return data ? mapFoodAnalysis(data as FoodAnalysisRow) : null;
}

export async function analyzeFoodProof(
  entry: EntryWithScore,
  options: { retry?: boolean } = {},
): Promise<FoodAnalysisResult> {
  const storagePath = entry.media.find((media) => media.mediaKind === 'proof')?.storagePath;
  if (!storagePath) {
    return {
      ok: false,
      status: 'pending',
      message: 'Food analysis pending until the proof photo is uploaded.',
    };
  }

  if (!options.retry) {
    const cached =
      (await getFoodAnalysisForEntry(entry.id).catch(() => null)) ??
      (await getFoodAnalysisForStoragePath(storagePath).catch(() => null));
    if (cached) {
      return { ok: true, analysis: { ...cached, source: 'cached' } };
    }
  }

  const payload: AnalyzeFoodProofPayload = {
    entry_id: entry.id,
    user_id: entry.userId,
    storage_path: storagePath,
    caption: entry.caption,
  };

  try {
    const { data, error } = await supabase.functions.invoke<EdgeFoodAnalysisResponse>(
      'analyze-food-proof',
      { body: payload },
    );

    if (error) {
      const result = classifyFunctionError(error);
      noteFoodAnalysisError(result.message);
      noteScoringError(result.message);
      return result;
    }

    const row = data ? edgeResponseToRow(data, payload) : null;
    if (!row) {
      const message = 'Food analysis pending. The function returned no analysis yet.';
      noteFoodAnalysisError(message);
      noteScoringError(message);
      return { ok: false, status: 'pending', message };
    }

    noteFoodAnalysisError(null);
    noteScoringError(null);
    return { ok: true, analysis: mapFoodAnalysis(row, 'edge') };
  } catch (error) {
    const result = classifyFunctionError(error);
    noteFoodAnalysisError(result.message);
    noteScoringError(result.message);
    return result;
  }
}
