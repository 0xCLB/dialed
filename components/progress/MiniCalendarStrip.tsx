import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { DailyScore } from '@/features/progress/types';

function labelForDate(value: string) {
  const [, month, day] = value.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function MiniCalendarStrip({
  scores,
  onSelectDate,
}: {
  scores: DailyScore[];
  onSelectDate?: (date: string) => void;
}) {
  const ordered = [...scores].sort((a, b) => a.scoreDate.localeCompare(b.scoreDate)).slice(-7);

  return (
    <View style={styles.strip}>
      {ordered.map((score) => {
        const fullyDialed = score.completedPillars === 4 || score.allPillarsCompleted;
        return (
          <Pressable
            key={score.scoreDate}
            accessibilityRole="button"
            onPress={() => onSelectDate?.(score.scoreDate)}
            style={({ pressed }) => [
              styles.day,
              fullyDialed && styles.fullDay,
              pressed && styles.pressed,
            ]}>
            <Text variant="caption" style={fullyDialed ? styles.fullText : styles.dateText}>
              {labelForDate(score.scoreDate)}
            </Text>
            <Text variant="caption" style={fullyDialed ? styles.fullText : styles.pointsText}>
              {score.totalPoints}
            </Text>
          </Pressable>
        );
      })}
      {ordered.length === 0 ? (
        <View style={styles.empty}>
          <Text muted>No scored days yet</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    minHeight: 74,
    flexDirection: 'row',
    gap: 8,
  },
  day: {
    flex: 1,
    minWidth: 42,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  fullDay: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.72,
  },
  dateText: {
    color: theme.colors.muted,
  },
  pointsText: {
    color: theme.colors.ink,
  },
  fullText: {
    color: theme.colors.white,
  },
  empty: {
    flex: 1,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
});
