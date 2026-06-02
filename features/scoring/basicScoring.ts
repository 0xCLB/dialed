import {
  getEntryProofType,
  getEntryTrustWeight,
  isEntryRankedEligible,
  isManualNote,
} from '@/features/entries/proofPolicy';
import type { EntryWithScore, ProofType, WellnessPillar } from '@/features/entries/types';

export type EntryDisplayScore = {
  points: number | null;
  official: boolean;
  basic: boolean;
  pending: boolean;
  rankedEligible: boolean;
  label: string;
  detail: string;
};

const ACTIVITY_BASE_POINTS: Array<[RegExp, number]> = [
  [/workout|lift|lifting|gym|training|weights?/, 18],
  [/run|cycling|bike|spin|hike|sport/, 16],
  [/walk|steps?/, 10],
  [/protein|meal|breakfast|lunch|dinner|salad|fuel/, 12],
  [/water|hydration|electrolyte/, 6],
  [/read|reading|journal|study|focus/, 8],
  [/meditat|mindful|breath/, 8],
  [/sauna|cold plunge|ice bath|recovery/, 10],
  [/stretch|mobility|yoga/, 8],
];

const PROOF_BASE_POINTS: Record<ProofType, number> = {
  photo: 10,
  location: 8,
  health: 12,
  hybrid: 16,
  manual_note: 0,
};

function numericMetadata(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function healthPreviewPoints(entry: EntryWithScore) {
  const preview = entry.metadata.health_score_preview;
  if (!preview || typeof preview !== 'object') {
    return null;
  }
  return numericMetadata((preview as { points?: unknown }).points);
}

function activityBasePoints(entry: EntryWithScore, proofType: ProofType) {
  const normalized = `${entry.activityTag ?? ''} ${entry.caption ?? ''}`.toLowerCase();
  const match = ACTIVITY_BASE_POINTS.find(([pattern]) => pattern.test(normalized));
  return match?.[1] ?? PROOF_BASE_POINTS[proofType];
}

function pillarBump(pillar?: WellnessPillar | null) {
  if (pillar === 'movement' || pillar === 'recovery') {
    return 1.05;
  }
  return 1;
}

export function getBasicEntryScore(entry: EntryWithScore) {
  if (entry.score) {
    return entry.score.points;
  }
  if (isManualNote(entry) || !isEntryRankedEligible(entry)) {
    return null;
  }

  const proofType = getEntryProofType(entry);
  const previewPoints = proofType === 'health' ? healthPreviewPoints(entry) : null;
  const basePoints = previewPoints ?? activityBasePoints(entry, proofType);
  const hybridBonus = proofType === 'hybrid' ? 5 : 0;
  const trustWeight = getEntryTrustWeight(entry);
  const pillar = entry.wellnessPillar;
  const points = Math.round((basePoints + hybridBonus) * trustWeight * pillarBump(pillar));

  return Math.max(3, points);
}

export function getEntryDisplayScore(entry: EntryWithScore): EntryDisplayScore {
  const rankedEligible = isEntryRankedEligible(entry);

  if (entry.score) {
    return {
      points: entry.score.points,
      official: true,
      basic: false,
      pending: false,
      rankedEligible,
      label: `+${entry.score.points} Dialed Points`,
      detail: `${Math.round(entry.score.confidence * 100)}% confidence`,
    };
  }

  if (isManualNote(entry)) {
    return {
      points: null,
      official: false,
      basic: false,
      pending: false,
      rankedEligible: false,
      label: 'Context only',
      detail: 'Manual notes help your timeline. Verified proofs move ranked score.',
    };
  }

  const points = getBasicEntryScore(entry);
  return {
    points,
    official: false,
    basic: points !== null,
    pending: true,
    rankedEligible,
    label: points === null ? 'Proof saved' : `Basic +${points} DP`,
    detail:
      points === null
        ? 'Proof Analysis pending.'
        : 'Basic score is live. Proof Analysis can refine it later.',
  };
}
