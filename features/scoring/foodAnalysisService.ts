import { supabase } from '@/lib/supabase';
import { noteFoodAnalysisError, noteScoringError } from '@/features/dev/diagnosticsStore';
import { getFoodAnalysisForEntry } from '@/features/food/foodAnalysisService';
import type { FoodAnalysis } from '@/features/food/types';
import type { FoodAnalysisResult, HealthinessLabel } from '@/features/scoring/types';

type EdgeFoodAnalysisResponse = Partial<{
  detected_foods: unknown;
  estimated_calories: number;
  estimated_protein_g: number;
  estimated_carbs_g: number;
  estimated_fat_g: number;
  healthiness_score: number;
  fuel_quality_label: HealthinessLabel;
  confidence: number;
  notes: string;
  suggested_points: number;
  warning: string;
  analysis: {
    detected_foods: unknown;
    estimated_calories: number | null;
    estimated_protein_g: number | string | null;
    estimated_carbs_g: number | string | null;
    estimated_fat_g: number | string | null;
    healthiness_score: number | null;
    fuel_quality_label: HealthinessLabel | null;
    confidence: number | string | null;
    notes: string | null;
    suggested_points: number | null;
    warning: string | null;
  };
}>;

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function foodsFrom(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  return [];
}

function fromCached(analysis: FoodAnalysis): FoodAnalysisResult {
  return {
    detectedFoods: analysis.detectedFoods,
    estimatedCalories: analysis.estimatedCalories,
    estimatedProteinG: analysis.estimatedProteinG,
    estimatedCarbsG: analysis.estimatedCarbsG,
    estimatedFatG: analysis.estimatedFatG,
    healthinessScore: analysis.healthinessScore,
    fuelQualityLabel: analysis.fuelQualityLabel,
    confidence: analysis.confidence ?? 0.3,
    notes: analysis.notes ?? 'Cached Food Proof analysis.',
    suggestedPoints: analysis.suggestedPoints ?? 10,
    source: 'cached',
    status: 'scored',
    warning: analysis.warning,
  };
}

function fromEdge(data: EdgeFoodAnalysisResponse): FoodAnalysisResult | null {
  const row = data.analysis;
  const detectedFoods = row ? foodsFrom(row.detected_foods) : foodsFrom(data.detected_foods);
  const healthinessScore = row
    ? numberOrNull(row.healthiness_score)
    : numberOrNull(data.healthiness_score);
  const fuelQualityLabel = row?.fuel_quality_label ?? data.fuel_quality_label ?? null;
  const hasSignal =
    detectedFoods.length > 0 ||
    healthinessScore !== null ||
    fuelQualityLabel !== null ||
    data.suggested_points !== undefined ||
    row?.suggested_points !== undefined;

  if (!hasSignal) return null;

  return {
    detectedFoods,
    estimatedCalories: row
      ? numberOrNull(row.estimated_calories)
      : numberOrNull(data.estimated_calories),
    estimatedProteinG: row
      ? numberOrNull(row.estimated_protein_g)
      : numberOrNull(data.estimated_protein_g),
    estimatedCarbsG: row ? numberOrNull(row.estimated_carbs_g) : numberOrNull(data.estimated_carbs_g),
    estimatedFatG: row ? numberOrNull(row.estimated_fat_g) : numberOrNull(data.estimated_fat_g),
    healthinessScore,
    fuelQualityLabel,
    confidence: row ? numberOrNull(row.confidence) ?? 0.3 : numberOrNull(data.confidence) ?? 0.3,
    notes: row?.notes ?? data.notes ?? 'Food Proof analysis is ready.',
    suggestedPoints: row
      ? numberOrNull(row.suggested_points) ?? 10
      : numberOrNull(data.suggested_points) ?? 10,
    source: 'edge_function',
    status: 'scored',
    warning: row?.warning ?? data.warning ?? null,
  };
}

function pendingMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();
  if (lower.includes('not found') || lower.includes('404')) {
    return 'Food analysis pending. The analyze-food-proof function is not deployed yet.';
  }
  if (lower.includes('unauthorized') || lower.includes('401') || lower.includes('403')) {
    return 'Food analysis needs a valid signed-in session.';
  }
  return 'Food analysis pending. Your proof is saved.';
}

export function fallbackFoodAnalysis(caption?: string | null): FoodAnalysisResult {
  const normalized = `${caption ?? ''}`.toLowerCase();
  const protein = /protein|chicken|fish|egg|yogurt|steak|tofu/.test(normalized);
  const hydration = /water|electrolyte|hydration/.test(normalized);
  const wholeFood = /salad|fruit|veg|rice|oat|meal|bowl/.test(normalized);
  const suggestedPoints = hydration ? 6 : protein ? 14 : wholeFood ? 12 : 8;

  return {
    detectedFoods: [],
    estimatedCalories: null,
    estimatedProteinG: null,
    estimatedCarbsG: null,
    estimatedFatG: null,
    healthinessScore: protein || wholeFood ? 65 : 50,
    fuelQualityLabel: protein || wholeFood ? 'solid' : 'okay',
    confidence: 0.25,
    notes: 'Basic Food Proof fallback. Estimated macros require server analysis.',
    suggestedPoints,
    source: 'rule',
    status: 'fallback',
    warning: 'Estimated macros are not medical advice.',
  };
}

export async function getCachedFoodAnalysis(entryId: string) {
  const cached = await getFoodAnalysisForEntry(entryId);
  return cached ? fromCached(cached) : null;
}

export async function analyzeFoodPhoto({
  entryId,
  storagePath,
  caption,
}: {
  entryId: string;
  storagePath: string;
  caption?: string | null;
}): Promise<FoodAnalysisResult> {
  const cached = await getCachedFoodAnalysis(entryId).catch(() => null);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke<EdgeFoodAnalysisResponse>(
      'analyze-food-proof',
      {
        body: {
          entry_id: entryId,
          storage_path: storagePath,
          caption,
        },
      },
    );

    if (error) {
      const message = pendingMessage(error);
      noteFoodAnalysisError(message);
      noteScoringError(message);
      return { ...fallbackFoodAnalysis(caption), status: 'pending', notes: message };
    }

    const edgeResult = data ? fromEdge(data) : null;
    if (edgeResult) {
      noteFoodAnalysisError(null);
      noteScoringError(null);
      return edgeResult;
    }
  } catch (error) {
    const message = pendingMessage(error);
    noteFoodAnalysisError(message);
    noteScoringError(message);
    return { ...fallbackFoodAnalysis(caption), status: 'pending', notes: message };
  }

  noteFoodAnalysisError('Food analysis pending.');
  return { ...fallbackFoodAnalysis(caption), status: 'pending', notes: 'Food analysis pending.' };
}
