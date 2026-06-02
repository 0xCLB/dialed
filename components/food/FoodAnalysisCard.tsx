import { StyleSheet, View } from 'react-native';
import { AlertTriangle, Gauge, Utensils } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { FoodAnalysis, FoodAnalysisResult } from '@/features/food/types';

function qualityCopy(label: FoodAnalysis['fuelQualityLabel']) {
  if (label === 'dialed') return 'Dialed';
  if (label === 'solid') return 'Solid';
  if (label === 'okay') return 'Okay';
  if (label === 'poor') return 'Needs work';
  return 'Pending';
}

function macro(value: number | null, suffix: string) {
  return value === null ? '-' : `${Math.round(value)}${suffix}`;
}

export function FoodAnalysisCard({
  result,
  compact,
}: {
  result: FoodAnalysisResult | null;
  compact?: boolean;
}) {
  const analysis = result?.ok ? result.analysis : null;
  const pendingMessage = !result || !result.ok ? result?.message ?? 'Food analysis pending.' : null;

  return (
    <Card style={compact ? styles.compactCard : styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Utensils size={20} color={theme.colors.white} />
        </View>
        <View style={styles.copy}>
          <Text variant="subtitle">Food Proof Analysis</Text>
          <Text variant="caption" muted>
            Estimated macros. Not medical advice.
          </Text>
        </View>
        {analysis?.confidence !== null && analysis?.confidence !== undefined ? (
          <View style={styles.confidence}>
            <Gauge size={14} color={theme.colors.primary} />
            <Text variant="caption" style={styles.confidenceText}>
              {Math.round(analysis.confidence * 100)}%
            </Text>
          </View>
        ) : null}
      </View>

      {analysis ? (
        <>
          <View style={styles.scoreRow}>
            <View style={styles.qualityPill}>
              <Text variant="caption" style={styles.qualityText}>
                Fuel quality
              </Text>
              <Text variant="subtitle" style={styles.qualityValue}>
                {qualityCopy(analysis.fuelQualityLabel)}
              </Text>
            </View>
            <View style={styles.qualityPill}>
              <Text variant="caption" style={styles.qualityText}>
                Healthiness
              </Text>
              <Text variant="subtitle" style={styles.qualityValue}>
                {analysis.healthinessScore ?? '-'}
              </Text>
            </View>
          </View>

          <View style={styles.macroGrid}>
            <MacroTile label="Calories" value={macro(analysis.estimatedCalories, '')} />
            <MacroTile label="Protein" value={macro(analysis.estimatedProteinG, 'g')} />
            <MacroTile label="Carbs" value={macro(analysis.estimatedCarbsG, 'g')} />
            <MacroTile label="Fat" value={macro(analysis.estimatedFatG, 'g')} />
          </View>

          {analysis.detectedFoods.length > 0 ? (
            <Text muted>
              Detected: {analysis.detectedFoods.slice(0, 4).join(', ')}
            </Text>
          ) : null}
          {analysis.notes ? <Text muted>{analysis.notes}</Text> : null}
          {analysis.warning ? (
            <View style={styles.warningRow}>
              <AlertTriangle size={15} color={theme.colors.warning} />
              <Text variant="caption" style={styles.warningText}>
                {analysis.warning}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.pendingBox}>
          <AlertTriangle size={18} color={theme.colors.warning} />
          <View style={styles.copy}>
            <Text variant="subtitle">Food analysis pending</Text>
            <Text muted>{pendingMessage}</Text>
          </View>
        </View>
      )}
    </Card>
  );
}

function MacroTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroTile}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="subtitle">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  compact: {
    gap: 10,
  },
  compactCard: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  confidence: {
    minHeight: 30,
    borderRadius: theme.radius.full,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.primarySoft,
  },
  confidenceText: {
    color: theme.colors.primaryDark,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qualityPill: {
    flex: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 3,
    backgroundColor: theme.colors.primarySoft,
  },
  qualityText: {
    color: theme.colors.primaryDark,
  },
  qualityValue: {
    color: theme.colors.primaryDark,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroTile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 64,
    borderRadius: theme.radius.md,
    padding: 10,
    justifyContent: 'center',
    gap: 3,
    backgroundColor: theme.colors.surfaceAlt,
  },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: theme.radius.md,
    padding: 12,
    backgroundColor: theme.colors.warningSoft,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: theme.colors.warning,
  },
});
