import { StyleSheet, View } from 'react-native';
import { Utensils } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { FuelQualityBadge } from '@/components/scoring/FuelQualityBadge';
import type { FoodAnalysisResult } from '@/features/scoring/types';

function macro(value: number | null | undefined, suffix = '') {
  return value === null || value === undefined ? '-' : `${Math.round(value)}${suffix}`;
}

export function FoodMacroCard({ analysis }: { analysis: FoodAnalysisResult | null }) {
  if (!analysis) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Utensils size={19} color={theme.colors.white} />
        </View>
        <View style={styles.copy}>
          <Text variant="subtitle">Estimated macros</Text>
          <Text variant="caption" muted>
            Not medical advice.
          </Text>
        </View>
      </View>

      <FuelQualityBadge label={analysis.fuelQualityLabel} />

      <View style={styles.grid}>
        <Macro label="Calories" value={macro(analysis.estimatedCalories)} />
        <Macro label="Protein" value={macro(analysis.estimatedProteinG, 'g')} />
        <Macro label="Carbs" value={macro(analysis.estimatedCarbsG, 'g')} />
        <Macro label="Fat" value={macro(analysis.estimatedFatG, 'g')} />
      </View>

      {analysis.detectedFoods.length > 0 ? (
        <Text muted>Detected: {analysis.detectedFoods.slice(0, 4).join(', ')}</Text>
      ) : null}
      <Text muted>{analysis.notes}</Text>
    </Card>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="subtitle">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 58,
    borderRadius: theme.radius.md,
    padding: 10,
    justifyContent: 'center',
    gap: 2,
    backgroundColor: theme.colors.surfaceAlt,
  },
});
