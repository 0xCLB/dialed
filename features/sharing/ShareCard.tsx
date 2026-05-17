import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/ui/Text';
import { PILLARS } from '@/lib/constants';
import type { Entry } from '@/types/domain';

export const ShareCard = forwardRef<View, { entry: Entry }>(function ShareCard({ entry }, ref) {
  const pillar = PILLARS[entry.pillar];

  return (
    <View ref={ref} collapsable={false} style={styles.wrap}>
      <LinearGradient colors={[pillar.color, '#111111']} style={styles.gradient}>
        <Text variant="caption" style={styles.kicker}>
          Dialed Self
        </Text>
        <View style={styles.copy}>
          <Text variant="hero" style={styles.title}>
            {entry.shareHeadline ?? entry.title}
          </Text>
          <Text style={styles.body}>{entry.aiSummary ?? entry.caption ?? pillar.description}</Text>
        </View>
        <View style={styles.footer}>
          <Text variant="metric" style={styles.points}>
            {entry.score}
          </Text>
          <Text variant="caption" style={styles.kicker}>
            Dialed Points · {pillar.label}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: 320,
    aspectRatio: 0.8,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111111',
  },
  gradient: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  kicker: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  copy: {
    gap: 12,
  },
  title: {
    color: '#FFFFFF',
  },
  body: {
    color: '#F7F4EE',
  },
  footer: {
    gap: 2,
  },
  points: {
    color: '#FFFFFF',
  },
});
