import { StyleSheet, View } from 'react-native';

import { theme } from '@/components/ui/theme';

export function ReelProgressDots({ count, index }: { count: number; index: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, dotIndex) => (
        <View
          key={dotIndex}
          style={[styles.dot, dotIndex === index ? styles.active : styles.inactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  active: {
    width: 28,
    backgroundColor: theme.colors.primary,
  },
  inactive: {
    width: 6,
    backgroundColor: theme.colors.faint,
    opacity: 0.55,
  },
});
