export type FuelQualityLabel = 'poor' | 'okay' | 'solid' | 'dialed';

export type FoodAnalysis = {
  id: string;
  entryId: string;
  userId: string;
  storagePath: string;
  detectedFoods: string[];
  estimatedCalories: number | null;
  estimatedProteinG: number | null;
  estimatedCarbsG: number | null;
  estimatedFatG: number | null;
  healthinessScore: number | null;
  fuelQualityLabel: FuelQualityLabel | null;
  confidence: number | null;
  notes: string | null;
  suggestedPoints: number | null;
  warning: string | null;
  modelName: string | null;
  createdAt: string;
  updatedAt: string;
  source: 'edge' | 'cached' | 'pending';
};

export type FoodAnalysisResult =
  | {
      ok: true;
      analysis: FoodAnalysis;
    }
  | {
      ok: false;
      status: 'pending' | 'not_deployed' | 'network' | 'auth' | 'setup_required' | 'server';
      message: string;
    };

export type AnalyzeFoodProofPayload = {
  entry_id: string;
  user_id?: string;
  storage_path: string;
  caption?: string | null;
};
