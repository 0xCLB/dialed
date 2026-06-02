export type WellnessPillar = 'movement' | 'fuel' | 'mind' | 'recovery';

export type PersistedEntryType = 'photo' | 'manual' | 'health' | 'location';

export type EntryType = PersistedEntryType | 'hybrid' | 'manual_note';

export type ProofType = 'photo' | 'location' | 'health' | 'hybrid' | 'manual_note';

export type VerificationMethod = 'photo' | 'location' | 'health' | 'hybrid' | 'manual_note';

export type ProofTrustLevel =
  | 'verified_health'
  | 'photo_ai'
  | 'photo_location'
  | 'location_only'
  | 'manual_note';

export const PROOF_TRUST_WEIGHTS: Record<ProofTrustLevel, number> = {
  verified_health: 1,
  photo_ai: 0.85,
  photo_location: 0.95,
  location_only: 0.65,
  manual_note: 0.15,
};

export type EntryVisibility = 'private' | 'friends' | 'public' | 'challenge';

export type EntryStatus = 'draft' | 'pending_score' | 'scored' | 'rejected' | 'deleted';

export type EntryMedia = {
  id: string;
  entryId: string;
  userId: string;
  bucketId: 'entry-photos';
  storagePath: string;
  objectPath: string;
  signedUrl: string | null;
  mediaKind: 'proof' | 'thumbnail';
  mimeType: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export type Entry = {
  id: string;
  userId: string;
  entryType: EntryType;
  activityTag: string | null;
  caption: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  wellnessPillar: WellnessPillar | null;
  visibility: EntryVisibility;
  status: EntryStatus;
  occurredAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type EntryScore = {
  entryId: string;
  userId: string;
  normalizedActivity: string;
  wellnessPillar: WellnessPillar;
  points: number;
  basePoints: number;
  bonusPoints: number;
  confidence: number;
  scoringSource: 'ai' | 'manual_review' | 'health' | 'rule';
  trustLevel: ProofTrustLevel;
  trustWeight: number;
  rankedEligible: boolean;
  aiSubtext: string | null;
  scoringExplanation: string | null;
  modelName: string | null;
  flagged: boolean;
  flagReason: string | null;
  metadata: Record<string, unknown>;
  scoredAt: string;
  updatedAt: string;
};

export type EntryWithScore = Entry & {
  score: EntryScore | null;
  media: EntryMedia[];
};

export type DailyScore = {
  id: string;
  userId: string;
  scoreDate: string;
  totalPoints: number;
  movementPoints: number;
  fuelPoints: number;
  mindPoints: number;
  recoveryPoints: number;
  completedPillars: number;
  allPillarsCompleted: boolean;
  streakCount: number;
  rankSnapshot: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateManualEntryInput = {
  userId: string;
  activityTag: string;
  caption?: string | null;
  wellnessPillar?: WellnessPillar | null;
  visibility?: EntryVisibility;
  occurredAt?: string;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  proofType?: ProofType;
  verificationMethod?: VerificationMethod;
  trustLevel?: ProofTrustLevel;
  rankedEligible?: boolean;
  scoreRequested?: boolean;
  consumesDailyProof?: boolean;
  metadata?: Record<string, unknown>;
};

export type CreatePhotoEntryInput = CreateManualEntryInput & {
  uri: string;
  mimeType?: string | null;
  base64?: string | null;
  width?: number | null;
  height?: number | null;
};

export type EntryDaySummary = {
  totalPoints: number;
  source: 'daily_score' | 'entry_scores';
  pillars: Record<WellnessPillar, number>;
  completedPillars: WellnessPillar[];
  pendingCount: number;
};
