import { forwardRef, ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/ui/Text';
import { PILLARS } from '@/lib/constants';
import type { ShareCardData, ShareCardTemplate } from '@/features/sharing/types';

const TEMPLATE_COLORS: Record<ShareCardTemplate, readonly [string, string, string]> = {
  clean: ['#F7F4EE', '#FFFFFF', '#EEE7FF'],
  dark: ['#050505', '#141414', '#5B21B6'],
  pastel: ['#F7F4EE', '#EEE7FF', '#E5F2FF'],
  athlete: ['#111111', '#2C144E', '#7C3AED'],
  leaderboard: ['#141414', '#3B1B7A', '#111111'],
  recovery: ['#FEF3C7', '#FFFFFF', '#EEE7FF'],
  hydration: ['#E5F2FF', '#FFFFFF', '#DFF8ED'],
  fully_dialed: ['#050505', '#5B21B6', '#10B981'],
};

function darkTemplate(template: ShareCardTemplate) {
  return ['dark', 'athlete', 'leaderboard', 'fully_dialed'].includes(template);
}

export const ShareCardFrame = forwardRef<View, {
  data: ShareCardData;
  children: ReactNode;
}>(function ShareCardFrame({ data, children }, ref) {
  const dark = darkTemplate(data.template);
  const pillarColor = data.pillar ? PILLARS[data.pillar].color : '#7C3AED';

  return (
    <View ref={ref} collapsable={false} style={styles.outer}>
      <LinearGradient colors={TEMPLATE_COLORS[data.template]} style={styles.frame}>
        {data.mediaUrl ? (
          <Image source={{ uri: data.mediaUrl }} style={styles.mediaGhost} blurRadius={18} />
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
            @{data.username ?? 'dialed'} · Get Dialed
          </Text>
          <Text variant="caption" style={[styles.footerText, dark && styles.lightMuted]}>
            {data.inviteCode ?? 'INVITE-CODE'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
});

export function ShareCardHeadline({
  data,
  children,
}: {
  data: ShareCardData;
  children?: ReactNode;
}) {
  const dark = darkTemplate(data.template);
  return (
    <View style={styles.headline}>
      <Text variant="caption" style={[styles.kicker, dark && styles.lightMuted]}>
        {data.kicker}
      </Text>
      <Text variant="hero" style={[styles.title, dark && styles.lightText]}>
        {data.title}
      </Text>
      <Text style={[styles.subtitle, dark && styles.lightMuted]}>{data.subtitle}</Text>
      {children}
    </View>
  );
}

export function ShareCardPoints({
  points,
  label = 'Dialed Points',
  dark,
}: {
  points?: number;
  label?: string;
  dark?: boolean;
}) {
  if (points === undefined) return null;
  return (
    <View style={[styles.points, dark && styles.pointsDark]}>
      <Text variant="metric" style={styles.pointsText}>
        {points}
      </Text>
      <Text variant="caption" style={styles.pointsLabel}>
        {label}
      </Text>
    </View>
  );
}

export function isDarkShareTemplate(template: ShareCardTemplate) {
  return darkTemplate(template);
}

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
    opacity: 0.18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    textTransform: 'uppercase',
    color: '#141414',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    gap: 18,
  },
  headline: {
    gap: 10,
  },
  kicker: {
    textTransform: 'uppercase',
    color: '#657083',
  },
  title: {
    color: '#141414',
  },
  subtitle: {
    color: '#393A40',
    fontWeight: '700',
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
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  pointsText: {
    color: '#FFFFFF',
  },
  pointsLabel: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});
