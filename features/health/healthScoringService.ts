import type { WellnessPillar } from '@/features/entries/types';
import type { HealthMetricType, HealthSample, HealthScoreResult } from '@/features/health/types';

function pointsForThresholds(value: number, thresholds: Array<[number, number]>) {
  return thresholds.reduce((points, [threshold, thresholdPoints]) => {
    return value >= threshold ? thresholdPoints : points;
  }, 0);
}

function metricPillar(metricType: HealthMetricType): WellnessPillar {
  if (metricType === 'mindfulness') return 'mind';
  if (metricType === 'sleep' || metricType === 'hrv' || metricType === 'recovery' || metricType === 'heart_rate') {
    return 'recovery';
  }
  return 'movement';
}

function scoreMetric(metricType: HealthMetricType, value: number) {
  if (metricType === 'steps') {
    const points = pointsForThresholds(value, [
      [3000, 5],
      [5000, 10],
      [8000, 15],
      [10000, 20],
      [12500, 24],
    ]);
    return {
      points,
      explanation:
        points > 0
          ? `${Math.round(value).toLocaleString()} steps gave Movement a receipt.`
          : 'Steps are logged, but not point-worthy yet.',
    };
  }

  if (metricType === 'workout') {
    const points = pointsForThresholds(value, [
      [10, 8],
      [15, 15],
      [30, 25],
      [60, 35],
    ]);
    return {
      points,
      explanation:
        points > 0
          ? `${Math.round(value)} workout minutes landed clean Movement points.`
          : 'Workout minutes are present, but too light for points.',
    };
  }

  if (metricType === 'calories') {
    const points = pointsForThresholds(value, [
      [250, 4],
      [400, 6],
      [600, 9],
      [800, 12],
    ]);
    return {
      points,
      explanation:
        points > 0
          ? `${Math.round(value)} active kcal added a small Movement bonus.`
          : 'Active energy is logged without a points bump yet.',
    };
  }

  if (metricType === 'sleep') {
    const hours = value / 60;
    const points = pointsForThresholds(hours, [
      [5, 6],
      [6, 12],
      [7, 20],
      [8, 24],
    ]);
    return {
      points,
      explanation:
        points > 0
          ? `${hours.toFixed(1)} hours of sleep helped Recovery act like an adult.`
          : 'Sleep is logged, but Recovery wants a little more proof.',
    };
  }

  if (metricType === 'mindfulness') {
    const points = pointsForThresholds(value, [
      [3, 4],
      [5, 8],
      [10, 12],
      [20, 20],
    ]);
    return {
      points,
      explanation:
        points > 0
          ? `${Math.round(value)} mindful minutes put Mind on the board.`
          : 'Mindfulness is logged, but not enough for points yet.',
    };
  }

  if (metricType === 'recovery') {
    const points = pointsForThresholds(value, [
      [50, 8],
      [70, 14],
      [85, 20],
    ]);
    return {
      points,
      explanation:
        points > 0
          ? 'Recovery score is strong enough to count.'
          : 'Recovery signal is present without a points bump yet.',
    };
  }

  if (metricType === 'hrv') {
    const points = pointsForThresholds(value, [
      [35, 4],
      [50, 8],
      [70, 12],
    ]);
    return {
      points,
      explanation:
        points > 0
          ? 'HRV looks steady enough for a Recovery nod.'
          : 'HRV is logged for context, not points yet.',
    };
  }

  return {
    points: 0,
    explanation: 'Health signal saved for context.',
  };
}

export function scoreHealthSample(sample: HealthSample): HealthScoreResult {
  const value = Number(sample.value ?? 0);
  const { points, explanation } = scoreMetric(sample.metricType, Number.isFinite(value) ? value : 0);
  const basePoints = Math.min(points, 20);

  return {
    sampleId: sample.id,
    metricType: sample.metricType,
    pillar: metricPillar(sample.metricType),
    basePoints,
    bonusPoints: Math.max(0, points - basePoints),
    points,
    explanation,
    source: 'health',
  };
}

export function scoreHealthSamples(samples: HealthSample[]) {
  return samples.map(scoreHealthSample);
}
