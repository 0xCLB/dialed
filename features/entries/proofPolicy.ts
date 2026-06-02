import type {
  Entry,
  EntryScore,
  EntryType,
  PersistedEntryType,
  ProofTrustLevel,
  ProofType,
  VerificationMethod,
} from '@/features/entries/types';
import { PROOF_TRUST_WEIGHTS } from '@/features/entries/types';

const PROOF_LABELS: Record<ProofType, string> = {
  photo: 'Verified Proof',
  location: 'Location Proof',
  health: 'Health Proof',
  hybrid: 'Hybrid Proof',
  manual_note: 'Manual Note',
};

const METHOD_LABELS: Record<VerificationMethod, string> = {
  photo: 'Photo proof',
  location: 'Location',
  health: 'Health data',
  hybrid: 'Hybrid',
  manual_note: 'Manual note',
};

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function booleanValue(value: unknown) {
  return typeof value === 'boolean' ? value : null;
}

export function normalizeProofType(value: unknown, persistedType?: PersistedEntryType): ProofType {
  const proofType = stringValue(value);
  if (
    proofType === 'photo' ||
    proofType === 'location' ||
    proofType === 'health' ||
    proofType === 'hybrid' ||
    proofType === 'manual_note'
  ) {
    return proofType;
  }

  if (persistedType === 'photo') return 'photo';
  if (persistedType === 'health') return 'health';
  if (persistedType === 'location') return 'location';
  return 'manual_note';
}

export function entryTypeFromPersisted(
  persistedType: PersistedEntryType,
  metadata: Record<string, unknown>,
): EntryType {
  const proofType = normalizeProofType(metadata.proof_type, persistedType);
  return persistedType === 'manual' ? 'manual_note' : proofType;
}

export function persistedEntryTypeForProof(proofType: ProofType): PersistedEntryType {
  if (proofType === 'manual_note') return 'manual';
  if (proofType === 'hybrid') return 'photo';
  return proofType;
}

export function trustLevelForProof(proofType: ProofType): ProofTrustLevel {
  if (proofType === 'health') return 'verified_health';
  if (proofType === 'hybrid') return 'photo_location';
  if (proofType === 'location') return 'location_only';
  if (proofType === 'photo') return 'photo_ai';
  return 'manual_note';
}

export function verificationMethodForProof(proofType: ProofType): VerificationMethod {
  if (proofType === 'manual_note') return 'manual_note';
  if (proofType === 'hybrid') return 'hybrid';
  return proofType;
}

export function trustWeightForLevel(level: ProofTrustLevel) {
  return PROOF_TRUST_WEIGHTS[level];
}

export function isRankedEligibleProof(proofType: ProofType, trustLevel = trustLevelForProof(proofType)) {
  return proofType !== 'manual_note' && trustWeightForLevel(trustLevel) >= 0.65;
}

export function getEntryProofType(entry: Pick<Entry, 'entryType' | 'metadata'>): ProofType {
  return normalizeProofType(entry.metadata?.proof_type, entry.entryType as PersistedEntryType);
}

export function getEntryVerificationMethod(entry: Pick<Entry, 'entryType' | 'metadata'>) {
  const method = stringValue(entry.metadata?.verification_method);
  if (
    method === 'photo' ||
    method === 'location' ||
    method === 'health' ||
    method === 'hybrid' ||
    method === 'manual_note'
  ) {
    return method;
  }
  return verificationMethodForProof(getEntryProofType(entry));
}

export function getEntryTrustLevel(entry: Pick<Entry, 'entryType' | 'metadata'>): ProofTrustLevel {
  const level = stringValue(entry.metadata?.trust_level);
  if (
    level === 'verified_health' ||
    level === 'photo_ai' ||
    level === 'photo_location' ||
    level === 'location_only' ||
    level === 'manual_note'
  ) {
    return level;
  }
  return trustLevelForProof(getEntryProofType(entry));
}

export function getEntryTrustWeight(entry: Pick<Entry, 'entryType' | 'metadata'>) {
  const metadataWeight = Number(entry.metadata?.trust_weight);
  if (Number.isFinite(metadataWeight)) {
    return metadataWeight;
  }
  return trustWeightForLevel(getEntryTrustLevel(entry));
}

export function isEntryRankedEligible(entry: Pick<Entry, 'entryType' | 'metadata'>) {
  const metadataEligible = booleanValue(entry.metadata?.ranked_eligible);
  if (metadataEligible !== null) {
    return metadataEligible;
  }
  return isRankedEligibleProof(getEntryProofType(entry), getEntryTrustLevel(entry));
}

export function isManualNote(entry: Pick<Entry, 'entryType' | 'metadata'>) {
  return getEntryProofType(entry) === 'manual_note';
}

export function proofTypeLabel(proofType: ProofType) {
  return PROOF_LABELS[proofType];
}

export function verificationMethodLabel(method: VerificationMethod) {
  return METHOD_LABELS[method];
}

export function entryProofLabel(entry: Pick<Entry, 'entryType' | 'metadata'>) {
  return proofTypeLabel(getEntryProofType(entry));
}

export function scoreTrustFromMetadata(metadata: Record<string, unknown>): Pick<
  EntryScore,
  'trustLevel' | 'trustWeight' | 'rankedEligible'
> {
  const proofType = normalizeProofType(metadata.proof_type);
  const trustLevel =
    stringValue(metadata.trust_level) === 'verified_health' ||
    stringValue(metadata.trust_level) === 'photo_ai' ||
    stringValue(metadata.trust_level) === 'photo_location' ||
    stringValue(metadata.trust_level) === 'location_only' ||
    stringValue(metadata.trust_level) === 'manual_note'
      ? (metadata.trust_level as ProofTrustLevel)
      : trustLevelForProof(proofType);

  const trustWeight = Number(metadata.trust_weight);
  const rankedEligible = booleanValue(metadata.ranked_eligible);

  return {
    trustLevel,
    trustWeight: Number.isFinite(trustWeight) ? trustWeight : trustWeightForLevel(trustLevel),
    rankedEligible:
      rankedEligible ?? isRankedEligibleProof(proofType, trustLevel),
  };
}

export function buildProofMetadata({
  proofType,
  verificationMethod,
  trustLevel,
  rankedEligible,
  scoreRequested,
  consumesDailyProof,
}: {
  proofType: ProofType;
  verificationMethod?: VerificationMethod;
  trustLevel?: ProofTrustLevel;
  rankedEligible?: boolean;
  scoreRequested?: boolean;
  consumesDailyProof?: boolean;
}) {
  const resolvedTrustLevel = trustLevel ?? trustLevelForProof(proofType);
  const resolvedRankedEligible =
    rankedEligible ?? isRankedEligibleProof(proofType, resolvedTrustLevel);
  const resolvedScoreRequested = scoreRequested ?? proofType !== 'manual_note';
  const resolvedConsumesDailyProof = consumesDailyProof ?? resolvedScoreRequested;

  return {
    proof_type: proofType,
    verification_method: verificationMethod ?? verificationMethodForProof(proofType),
    trust_level: resolvedTrustLevel,
    trust_weight: trustWeightForLevel(resolvedTrustLevel),
    ranked_eligible: resolvedRankedEligible,
    score_requested: resolvedScoreRequested,
    proof_consumption: resolvedConsumesDailyProof ? 'spend' : 'free',
  };
}
