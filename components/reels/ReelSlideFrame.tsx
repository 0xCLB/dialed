import { forwardRef, ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/ui/Text';
import { PILLARS } from '@/lib/constants';
import type { ReelData, ReelSlide, ReelTemplate } from '@/features/reels/types';

const TEMPLATE_COLORS: Record<ReelTemplate, readonly [string, string, string]> = {
  clean: ['#F7F4EE', '#FFFFFF', '#EEE7FF'],
  dark: ['#050505', '#141414', '#5B21B6'],
  pastel: ['#F7F4EE', '#EEE7FF', '#E5F2FF'],
  athlete: ['#111111', '#2C144E', '#7C3AED'],
  leaderboard: ['#141414', '#3B1B7A', '#111111'],
  fully_dialed: ['#050505', '#5B21B6', '#10B981'],
};

export function isDarkReelTemplate(template: ReelTemplate) {
  return ['dark', 'athlete', 'leaderboard', 'fully_dialed'].includes(template);
}

export const ReelSlideFrame = forwardRef<
  View,
  {
    data: ReelData;
    slide: ReelSlide;
    template: ReelTemplate;
    children: ReactNode;
  }
>(function ReelSlideFrame({ data, slide, template, children }, ref) {
  const dark = isDarkReelTemplate(template);
  const pillarColor = slide.pillar ? PILLARS[slide.pillar].color : '#7C3AED';

  return (
    <View ref={ref} collapsable={false} style={styles.outer}>
      <LinearGradient colors={TEMPLATE_COLORS[template]} style={styles.frame}>
        {slide.mediaUrl ? (
          <Image source={{ uri: slide.mediaUrl }} style={styles.mediaGhost} blurRadius={18} />
        ) : null}
        <View style={styles.topRow}>
          <Text variant="caption" style={[styles.brand, dark && styles.lightText]}>
            Dialed Self
          </Text>
          <View style={[styles.dot, { backgroundColor: pillarColor }]} />
        </View>
        <View style={styles.content}>{children}</View>
        <View style={styles.footer}>
          <Text variant="caption" style={[styles.footerText, dark && styles.lightMuted]}>
            @{data.username ?? 'dialed'} - Get Dialed
          </Text>
          {data.watermark ? (
            <Text variant="caption" style={[styles.footerText, dark && styles.lightMuted]}>
              Proof &gt; promises
            </Text>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
});

export function ReelKicker({
  slide,
  dark,
}: {
  slide: ReelSlide;
  dark: boolean;
}) {
  return (
    <Text variant="caption" style={[styles.kicker, dark && styles.lightMuted]}>
      {slide.kicker}
    </Text>
  );
}

export function ReelPoints({ points, dark }: { points?: number | null; dark: boolean }) {
  if (points === undefined || points === null) return null;
  return (
    <View style={[styles.points, dark && styles.pointsDark]}>
      <Text variant="metric" style={styles.pointsValue}>
        {points}
      </Text>
      <Text variant="caption" style={styles.pointsLabel}>
        Dialed Points
      </Text>
    </View>
  );
}

export const reelFrameStyles = StyleSheet.create({
  lightText: {
    color: '#FFFFFF',
  },
  lightMuted: {
    color: '#F7F4EE',
  },
  darkText: {
    color: '#141414',
  },
  muted: {
    color: '#657083',
  },
});

const styles = StyleSheet.create({
  outer: {
    width: 320,
    aspectRatio: 9 / 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#050505',
  },
  frame: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  mediaGhost: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: '#141414',
    textTransform: 'uppercase',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    gap: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerText: {
    color: '#657083',
    textTransform: 'uppercase',
  },
  kicker: {
    color: '#657083',
    textTransform: 'uppercase',
  },
  lightText: {
    color: '#FFFFFF',
  },
  lightMuted: {
    color: '#F7F4EE',
  },
  points: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#7C3AED',
  },
  pointsDark: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  pointsValue: {
    color: '#FFFFFF',
  },
  pointsLabel: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});
