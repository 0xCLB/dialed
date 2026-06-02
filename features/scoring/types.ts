export type ProofType =
  | 'photo'
  | 'food_photo'
  | 'location'
  | 'health'
  | 'hybrid'
  | 'manual_note';

export type TrustLevel =
  | 'verified_health'
  | 'photo_ai'
  | 'photo_location'
  | 'location_only'
  | 'manual_note'
  | 'pending';

export type WellnessPillar = 'movement' | 'fuel' | 'mind' | 'recovery';

export type HealthinessLabel = 'poor' | 'okay' | 'solid' | 'dialed';

export type ScoringStatus = 'pending' | 'scored' | 'fallback' | 'failed';

export type ScoringSource = 'edge_function' | 'rule' | 'health' | 'cached';

export type FoodAnalysisResult = {
  detectedFoods: string[];
  estimatedCalories?: number | null;
  estimatedProteinG?: number | null;
  estimatedCarbsG?: number | null;
  estimatedFatG?: number | null;
  healthinessScore?: number | null;
  fuelQualityLabel?: HealthinessLabel | null;
  confidence: number;
  notes: string;
  suggestedPoints: number;
  source: ScoringSource;
  status: ScoringStatus;
  warning?: string | null;
};

export type ScoreResult = {
  entryId: string;
  proofType: ProofType;
  trustLevel: TrustLevel;
  wellnessPillar: WellnessPillar;
  points: number;
  basePoints: number;
  bonusPoints: number;
  confidence: number;
  explanation: string;
  status: ScoringStatus;
  source: ScoringSource;
  rankedEligible: boolean;
  normalizedActivity?: string | null;
  subtext?: string | null;
  foodAnalysis?: FoodAnalysisResult | null;
  metadata?: Record<string, unknown>;
};
