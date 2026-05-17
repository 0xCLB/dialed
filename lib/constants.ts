import type { GoalKey, WellnessPillar } from '@/types/domain';

export const APP_NAME = 'Dialed Self';

export const REVENUECAT_ENTITLEMENT = 'dialed_pro';

export const PILLARS: Record<
  WellnessPillar,
  {
    label: string;
    color: string;
    softColor: string;
    description: string;
  }
> = {
  movement: {
    label: 'Movement',
    color: '#0E8F68',
    softColor: '#DFF5EC',
    description: 'Training, steps, sport, active minutes, and workouts.',
  },
  fuel: {
    label: 'Fuel',
    color: '#D97706',
    softColor: '#FFF1D6',
    description: 'Hydration, protein, healthy meals, fasting, and supplements.',
  },
  mind: {
    label: 'Mind',
    color: '#3662E3',
    softColor: '#E6EDFF',
    description: 'Reading, journaling, meditation, learning, and deep work.',
  },
  recovery: {
    label: 'Recovery',
    color: '#7C3AED',
    softColor: '#EEE7FF',
    description: 'Sleep, mobility, sauna, stretching, breathwork, and rest.',
  },
};

export const PILLAR_ORDER: WellnessPillar[] = ['movement', 'fuel', 'mind', 'recovery'];

export const ACTION_CATALOG: Record<
  WellnessPillar,
  Array<{ key: string; label: string; defaultPoints: number }>
> = {
  movement: [
    { key: 'gym', label: 'Gym session', defaultPoints: 50 },
    { key: 'run', label: 'Run', defaultPoints: 55 },
    { key: 'walk', label: 'Walk', defaultPoints: 30 },
    { key: 'sport', label: 'Sport', defaultPoints: 45 },
    { key: 'class', label: 'Class', defaultPoints: 45 },
  ],
  fuel: [
    { key: 'hydration', label: 'Hydration', defaultPoints: 20 },
    { key: 'protein', label: 'Protein target', defaultPoints: 35 },
    { key: 'healthy_meal', label: 'Healthy meal', defaultPoints: 40 },
    { key: 'supplements', label: 'Supplements', defaultPoints: 15 },
    { key: 'fasting', label: 'Fasting window', defaultPoints: 35 },
  ],
  mind: [
    { key: 'reading', label: 'Reading', defaultPoints: 25 },
    { key: 'journaling', label: 'Journaling', defaultPoints: 25 },
    { key: 'meditation', label: 'Meditation', defaultPoints: 30 },
    { key: 'deep_work', label: 'Deep work', defaultPoints: 35 },
    { key: 'therapy', label: 'Therapy', defaultPoints: 40 },
  ],
  recovery: [
    { key: 'sleep', label: 'Sleep target', defaultPoints: 45 },
    { key: 'stretching', label: 'Stretching', defaultPoints: 25 },
    { key: 'mobility', label: 'Mobility', defaultPoints: 30 },
    { key: 'sauna', label: 'Sauna', defaultPoints: 35 },
    { key: 'cold_plunge', label: 'Cold plunge', defaultPoints: 30 },
  ],
};

export const GOALS: Array<{ key: GoalKey; label: string }> = [
  { key: 'build_strength', label: 'Build strength' },
  { key: 'lose_fat', label: 'Lose fat' },
  { key: 'run_faster', label: 'Run faster' },
  { key: 'sleep_better', label: 'Sleep better' },
  { key: 'eat_cleaner', label: 'Eat cleaner' },
  { key: 'reduce_stress', label: 'Reduce stress' },
  { key: 'stay_consistent', label: 'Stay consistent' },
];

export const STORAGE_BUCKETS = {
  entryProofs: 'entry-proofs',
  shareAssets: 'share-assets',
} as const;

export const DATE_KEY_FORMAT = 'yyyy-MM-dd';
