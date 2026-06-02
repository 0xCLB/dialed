import { supabase } from '@/lib/supabase';
import { noteScoringError } from '@/features/dev/diagnosticsStore';
import type { WellnessPillar } from '@/features/entries/types';

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
    return { ok: true, data };
  } catch (error) {
    const result = classifyFunctionError(error);
    noteScoringError(result.message);
    return result;
  }
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
