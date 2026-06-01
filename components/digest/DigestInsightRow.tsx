import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PILLARS } from '@/lib/constants';
import type { DigestInsight } from '@/features/digest/types';

export function DigestInsightRow({ insight }: { insight: DigestInsight }) {
  const accent = insight.pillar ? PILLARS[insight.pillar].color : theme.colors.primary;

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: accent }]}>
        <Sparkles size={15} color={theme.colors.white} />
      </View>
      <View style={styles.copy}>
        <Text variant="caption" muted>
          {insight.label}
        </Text>
        <Text>{insight.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
});
